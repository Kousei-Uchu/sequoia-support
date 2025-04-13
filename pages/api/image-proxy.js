import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN,
  request: { fetch: require('node-fetch') }
});

export default async function handler(req, res) {
  const { path } = req.query;

  if (!path) {
    // Return default avatar if no path provided
    return res.redirect(307, '/default-avatar.png');
  }

  try {
    // Handle both regular and temp image paths
    let actualPath = path;
    
    // If looking for temp image, find the most recent one
    if (path.includes('temp/')) {
      const username = path.split('/')[2].split('-')[0];
      const tempDir = 'pictures/temp';
      
      try {
        const { data: files } = await octokit.repos.getContent({
          owner: process.env.GITHUB_REPO_OWNER,
          repo: process.env.GITHUB_REPO_NAME,
          path: tempDir
        });

        // Find all temp files for this user and get the newest one
        const userFiles = files
          .filter(file => file.name.startsWith(`${username}-`) && file.name.endsWith('.png'))
          .sort((a, b) => b.name.localeCompare(a.name));

        if (userFiles.length > 0) {
          actualPath = `${tempDir}/${userFiles[0].name}`;
        } else {
          return res.redirect(307, '/default-avatar.png');
        }
      } catch (error) {
        console.error('Error finding temp image:', error);
        return res.redirect(307, '/default-avatar.png');
      }
    }

    // Get the image content
    const { data: fileData } = await octokit.repos.getContent({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: actualPath
    });

    const imageBuffer = fileData.download_url
      ? await (await fetch(fileData.download_url)).arrayBuffer()
      : Buffer.from(fileData.content, 'base64');

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', path.includes('temp/')
      ? 'public, max-age=3600'  // 1 hour for temp images
      : 'public, max-age=86400'); // 1 day for permanent images

    return res.send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error('Image proxy failed:', error);
    return res.redirect(307, '/default-avatar.png');
  }
}

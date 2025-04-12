import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN
});

export default async function handler(req, res) {
  const { path } = req.query;

  try {
    // Handle wildcard in temp filenames
    let actualPath = path;
    if (path.includes('*')) {
      const username = path.split('/').pop().split('-')[0];
      const dirPath = path.split('/').slice(0, -1).join('/');
      
      // List all files in temp directory
      const { data: files } = await octokit.repos.getContent({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: dirPath
      });

      // Find most recent temp file for this user
      const userFiles = files
        .filter(file => file.name.startsWith(`${username}-`) && file.name.endsWith('.png'))
        .sort((a, b) => b.name.localeCompare(a.name)); // Sort by newest first

      if (userFiles.length > 0) {
        actualPath = `${dirPath}/${userFiles[0].name}`;
      } else {
        return res.status(404).send('No temp image found');
      }
    }

    const { data: fileData } = await octokit.repos.getContent({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: actualPath
    });

    const imageBuffer = Buffer.from(fileData.content, 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', actualPath.includes('temp/') 
      ? 'public, max-age=3600' 
      : 'public, max-age=86400');
    return res.send(imageBuffer);

  } catch (error) {
    console.error('Image proxy failed:', error);
    const defaultAvatar = await fetch(`${req.headers.origin}/default-avatar.png`);
    const avatarBuffer = await defaultAvatar.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    return res.send(Buffer.from(avatarBuffer));
  }
}

import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN,
  request: { fetch: require('node-fetch') }
});

async function tryGetImage(path) {
  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: path,
      headers: { 'Cache-Control': 'no-cache' }
    });

    return fileData.download_url
      ? await (await fetch(fileData.download_url)).arrayBuffer()
      : Buffer.from(fileData.content, 'base64');
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.redirect(307, '/default-avatar.png');
  }

  try {
    // First try permanent location
    const permPath = `pictures/${username}.png`;
    let imageBuffer = await tryGetImage(permPath);

    // If not found, try temp location
    if (!imageBuffer) {
      const tempPath = `pictures/temp/${username}-*.png`;
      const { data: tempFiles } = await octokit.repos.getContent({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: 'pictures/temp',
        headers: { 'Cache-Control': 'no-cache' }
      });

      // Find most recent temp file for this user
      const userTempFiles = tempFiles.filter(file => 
        file.name.startsWith(`${username}-`) && file.name.endsWith('.png')
      ).sort((a, b) => b.name.localeCompare(a.name));

      if (userTempFiles.length > 0) {
        imageBuffer = await tryGetImage(`pictures/temp/${userTempFiles[0].name}`);
      }
    }

    if (!imageBuffer) {
      throw new Error('No image found');
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Image proxy failed:', error);
    return res.redirect(307, '/default-avatar.png');
  }
}

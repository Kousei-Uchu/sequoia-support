import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN,
  request: { fetch: require('node-fetch') }
});

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    // Return default avatar if no URL provided
    const defaultAvatar = await fetch(`${req.headers.origin}/default-avatar.png`);
    const avatarBuffer = await defaultAvatar.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    return res.send(Buffer.from(avatarBuffer));
  }

  try {
    // Extract path from GitHub URL if it's a GitHub URL
    let filePath;
    if (url.includes('github.com')) {
      filePath = new URL(url).pathname.split('main/')[1];
    } else {
      filePath = url;
    }

    // Handle both regular and temp files
    const { data: fileData } = await octokit.repos.getContent({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: filePath,
      headers: { 'Cache-Control': 'no-cache' }
    });

    const imageBuffer = fileData.download_url 
      ? await (await fetch(fileData.download_url)).arrayBuffer()
      : Buffer.from(fileData.content, 'base64');

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', filePath.includes('temp/') 
      ? 'public, max-age=3600' 
      : 'public, max-age=86400');
    return res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Image proxy failed:', error);
    // Return default avatar on error
    const defaultAvatar = await fetch(`${req.headers.origin}/default-avatar.png`);
    const avatarBuffer = await defaultAvatar.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    return res.send(Buffer.from(avatarBuffer));
  }
}

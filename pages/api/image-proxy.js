import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN,
  request: { fetch: require('node-fetch') }
});

export default async function handler(req, res) {
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Path parameter is required' });
  }

  try {
    // Handle both regular and temp image paths
    const fullPath = path.startsWith('pictures/') ? path : `pictures/${path}`;
    
    const { data: fileData } = await octokit.repos.getContent({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: fullPath,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    // For files in the repository (not temp)
    if (fileData.download_url) {
      const imageResponse = await fetch(fileData.download_url);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(Buffer.from(imageBuffer));
    }

    // For temp files (base64 encoded content)
    if (fileData.content) {
      const imageBuffer = Buffer.from(fileData.content, 'base64');
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Shorter cache for temp files
      return res.send(imageBuffer);
    }

    throw new Error('Unsupported file type');

  } catch (error) {
    console.error('Image proxy failed:', error);
    // Return default avatar if image not found
    const defaultAvatar = await fetch(`${req.headers.origin}/default-avatar.png`);
    const avatarBuffer = await defaultAvatar.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    return res.send(Buffer.from(avatarBuffer));
  }
}

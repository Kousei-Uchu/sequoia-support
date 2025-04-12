import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN,
  request: { fetch: require('node-fetch') }
});

export default async function handler(req, res) {
  const { user, ts } = req.query;

  try {
    const { data: imageData } = await octokit.repos.getContent({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: `pictures/${user}.png`,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    // Fetch the raw image (GitHub API returns a download URL)
    const imageResponse = await fetch(imageData.download_url);
    const imageBuffer = await imageResponse.arrayBuffer();

    // Set proper headers and send the image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h
    return res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Image proxy failed:', error);
    return res.status(404).send('Image not found');
  }
}

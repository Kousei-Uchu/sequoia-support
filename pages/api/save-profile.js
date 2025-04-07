import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username } = req.body;
    
    // Get SHA of existing file if it exists
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_DATA_REPO.split('/')[0],
        repo: process.env.GITHUB_DATA_REPO.split('/')[1],
        path: `profiles/${username}.json`
      });
      sha = data.sha;
    } catch (error) {
      sha = null; // File doesn't exist yet
    }

    // Save the profile
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_DATA_REPO.split('/')[0],
      repo: process.env.GITHUB_DATA_REPO.split('/')[1],
      path: `profiles/${username}.json`,
      message: sha ? `Update profile for ${username}` : `Create profile for ${username}`,
      content: Buffer.from(JSON.stringify(req.body, null, 2)).toString('base64'),
      sha: sha
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to save profile',
      details: error.message 
    });
  }
}

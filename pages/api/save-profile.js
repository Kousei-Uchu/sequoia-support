import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  const octokit = new Octokit({ 
    auth: process.env.GITHUB_TOKEN 
  });

  try {
    const { username } = req.body;
    
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_DATA_REPO.split('/')[0],
      repo: process.env.GITHUB_DATA_REPO.split('/')[1],
      path: `profiles/${username}.json`,
      message: `Update profile for ${username}`,
      content: Buffer.from(JSON.stringify(req.body)).toString('base64'),
      sha: await getFileSha(octokit, username)
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getFileSha(octokit, username) {
  try {
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_DATA_REPO.split('/')[0],
      repo: process.env.GITHUB_DATA_REPO.split('/')[1],
      path: `profiles/${username}.json`
    });
    return data.sha;
  } catch {
    return null;
  }
}

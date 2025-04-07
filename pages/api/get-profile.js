import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN 
});

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: `profiles/${username}.json`
    });

    const content = Buffer.from(data.content, 'base64').toString('utf8');
    return res.status(200).json(JSON.parse(content));
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    return res.status(500).json({ error: error.message });
  }
}

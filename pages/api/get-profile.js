import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_DATA_REPO.split('/')[0],
      repo: process.env.GITHUB_DATA_REPO.split('/')[1],
      path: `profiles/${username}.json`
    });

    const content = JSON.parse(Buffer.from(data.content, 'base64').toString());
    return res.status(200).json(content);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    return res.status(500).json({ error: error.message });
  }
}

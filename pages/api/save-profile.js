import { getSession } from 'next-auth/react';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const profileData = {
    ...req.body,
    username: session.user.username, // Ensure GitHub username is used
    lastUpdated: new Date().toISOString()
  };

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_DATA_REPO.split('/')[0],
      repo: process.env.GITHUB_DATA_REPO.split('/')[1],
      path: `profiles/${session.user.username}.json`,
      message: `Update profile for ${session.user.username}`,
      content: Buffer.from(JSON.stringify(profileData)).toString('base64'),
      sha: await getFileSha(session.user.username)
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getFileSha(username) {
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

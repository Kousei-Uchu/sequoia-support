import { getSession } from 'next-auth/react';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN 
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Validate required fields
    if (!req.body.name || !req.body.about) {
      return res.status(400).json({ error: 'Name and about are required' });
    }

    const profileData = {
      ...req.body,
      username: session.user.username,
      lastUpdated: new Date().toISOString()
    };

    const filePath = `profiles/${session.user.username}.json`;
    const message = `Update profile for ${session.user.username}`;
    const content = Buffer.from(JSON.stringify(profileData, null, 2)).toString('base64');

    // Try to get existing file SHA
    let sha = null;
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: filePath
      });
      sha = data.sha;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }

    // Create or update file
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: filePath,
      message: message,
      content: content,
      sha: sha
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving profile:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to save profile',
      details: error.response?.data
    });
  }
}

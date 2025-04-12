import { getToken } from 'next-auth/jwt';
import { Octokit } from '@octokit/rest';
import CryptoJS from 'crypto-js';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

function generateUserKey(username) {
  return CryptoJS.SHA256(username + '-sequoia').toString();
}

function encryptData(data, key) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = await getToken({ req });
    if (!token?.username) {
      return res.status(401).json({ error: 'Unauthorized - No token found' });
    }

    const username = token.username;
    const { profile, tempImagePath } = req.body;

    if (!profile) {
      return res.status(400).json({ error: 'Profile data is required' });
    }

    // 1. Handle image movement if temp image exists
    if (tempImagePath) {
      try {
        const finalImagePath = `pictures/${username}.png`;
        
        // Get temp file content
        const { data: tempFile } = await octokit.repos.getContent({
          owner: process.env.GITHUB_REPO_OWNER,
          repo: process.env.GITHUB_REPO_NAME,
          path: tempImagePath,
          branch: 'main'
        });

        // Create permanent file
        await octokit.repos.createOrUpdateFileContents({
          owner: process.env.GITHUB_REPO_OWNER,
          repo: process.env.GITHUB_REPO_NAME,
          path: finalImagePath,
          message: `Profile image for ${username}`,
          content: tempFile.content,
          branch: 'main'
        });

        // Delete temp file
        await octokit.repos.deleteFile({
          owner: process.env.GITHUB_REPO_OWNER,
          repo: process.env.GITHUB_REPO_NAME,
          path: tempImagePath,
          message: `Remove temp image for ${username}`,
          sha: tempFile.sha,
          branch: 'main'
        });
      } catch (error) {
        console.error('Image processing error:', error);
        return res.status(500).json({ 
          error: 'Failed to process image',
          details: error.message
        });
      }
    }

    // 2. Encrypt and save profile data
    try {
      const key = generateUserKey(username);
      const encrypted = encryptData({
        ...profile,
        username,
        lastUpdated: new Date().toISOString()
      }, key);

      const filePath = `profiles/${username}.json`;
      const content = Buffer.from(encrypted).toString('base64');

      // Check if file exists to get SHA
      let sha;
      try {
        const { data } = await octokit.repos.getContent({
          owner: process.env.GITHUB_REPO_OWNER,
          repo: process.env.GITHUB_REPO_NAME,
          path: filePath,
          branch: 'main'
        });
        sha = data.sha;
      } catch (error) {
        if (error.status !== 404) throw error;
      }

      await octokit.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: filePath,
        message: `Save profile for ${username}`,
        content,
        sha,
        branch: 'main'
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Profile save error:', error);
      return res.status(500).json({ 
        error: 'Failed to save profile data',
        details: error.message
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}

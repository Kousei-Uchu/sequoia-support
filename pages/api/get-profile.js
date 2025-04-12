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

async function cleanTempFiles(username) {
  try {
    const { data: files } = await octokit.repos.getContent({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: 'pictures/temp'
    });

    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    
    for (const file of files) {
      if (file.name.startsWith(`${username}-`) && 
          new Date(file.name.split('-')[1].replace('.png', '')) < twoHoursAgo) {
        await octokit.repos.deleteFile({
          owner: process.env.GITHUB_REPO_OWNER,
          repo: process.env.GITHUB_REPO_NAME,
          path: file.path,
          message: `Clean up old temp file`,
          sha: file.sha
        });
      }
    }
  } catch (error) {
    console.error('Error cleaning temp files:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const username = token.username || token.sub;
  const { profile, tempImagePath } = req.body;

  try {
    // Handle image movement from temp to permanent
    if (tempImagePath) {
      const finalImagePath = `pictures/${username}.png`;
      
      // Get temp file content
      const { data: tempFile } = await octokit.repos.getContent({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: tempImagePath
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
        sha: tempFile.sha
      });
    }

    // Clean up old temp files
    await cleanTempFiles(username);

    // Encrypt and save profile data
    const key = generateUserKey(username);
    const encrypted = encryptData({
      ...profile,
      username,
      lastUpdated: new Date().toISOString()
    }, key);

    const filePath = `profiles/${username}.json`;
    const content = Buffer.from(encrypted).toString('base64');

    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: filePath
      });
      sha = data.sha;
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: filePath,
      message: `Save encrypted profile for ${username}`,
      content,
      sha
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to save profile',
      details: error.response?.data?.message
    });
  }
}

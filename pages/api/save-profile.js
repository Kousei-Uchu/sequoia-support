import { Octokit } from '@octokit/rest';
import CryptoJS from 'crypto-js';
import { getToken } from 'next-auth/jwt';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  request: { fetch: require('node-fetch') }
});

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const VALID_IMAGE_TYPES = ['png', 'jpeg', 'jpg', 'webp'];

function generateUserKey(username) {
  return CryptoJS.SHA256(username + '-sequoia').toString();
}

function encryptData(data, key) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
}

async function validateAndMoveImage(tempImagePath, username) {
  try {
    const { data: tempImageMeta } = await octokit.repos.getContent({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: tempImagePath
    });

    if (tempImageMeta.type !== 'file' || !tempImageMeta.download_url) {
      throw new Error('Temp image is not a valid file or lacks a download URL');
    }

    const response = await fetch(tempImageMeta.download_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch raw image from GitHub: ${response.status}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    if (imageBuffer.length > MAX_IMAGE_SIZE) {
      throw new Error(`Image exceeds maximum size of ${MAX_IMAGE_SIZE} bytes`);
    }

    const ext = tempImagePath.split('.').pop().toLowerCase();
    if (!VALID_IMAGE_TYPES.includes(ext)) {
      throw new Error(`Unsupported image type: ${ext}`);
    }

    const permanentPath = `pictures/${username}.png`;
    let existingSha = null;

    try {
      const { data: existing } = await octokit.repos.getContent({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: permanentPath
      });
      existingSha = existing.sha;
    } catch { }

    const base64Content = imageBuffer.toString('base64');

    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: permanentPath,
      message: `Profile image for ${username}`,
      content: base64Content,
      sha: existingSha,
      branch: 'main'
    });

    await octokit.repos.deleteFile({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: tempImagePath,
      message: `Delete temp image for ${username}`,
      sha: tempImageMeta.sha,
      branch: 'main'
    });

    return `/api/image-proxy?path=${permanentPath}&ts=${Date.now()}`;
    
  } catch (error) {
    console.error('Image processing error details:', {
      error: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    throw new Error(`Image processing failed: ${error.message}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = await getToken({ req });
    if (!token?.username) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { profile, tempImagePath } = req.body;
    const username = token.username;
    const key = generateUserKey(username);
    const encrypted = encryptData(profile, key);

    const profilePath = `profiles/${username}.json`;
    let profileSha = null;

    try {
      const { data: existingProfile } = await octokit.repos.getContent({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: profilePath
      });
      profileSha = existingProfile.sha;
    } catch {
      console.log('Creating new profile file');
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: profilePath,
      message: `Update profile for ${username}`,
      content: Buffer.from(encrypted).toString('base64'),
      sha: profileSha,
      branch: 'main'
    });

    let photoUrl = null;
    if (tempImagePath) {
      photoUrl = await validateAndMoveImage(tempImagePath, username);
    }

    return res.status(200).json({
      success: true,
      photo: photoUrl || undefined
    });

  } catch (error) {
    console.error('Complete save error:', {
      message: error.message,
      stack: error.stack,
      request: error.request,
      response: error.response?.data
    });

    if (error.status === 403 && error.headers?.['x-ratelimit-remaining'] === '0') {
      return res.status(429).json({
        error: 'GitHub API rate limit exceeded',
        reset: new Date(error.headers['x-ratelimit-reset'] * 1000)
      });
    }

    return res.status(500).json({
      error: error.message || 'Failed to save profile',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        apiError: error.response?.data
      } : undefined
    });
  }
}

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
    const { data: tempImage } = await octokit.repos.getContent({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: tempImagePath
    });

    console.log('Temp image metadata:', {
      path: tempImagePath,
      size: tempImage.size,
      sha: tempImage.sha
    });

    if (!tempImage.content) {
      throw new Error('Temp image has no content');
    }

    const imageBuffer = Buffer.from(tempImage.content, 'base64');
    
    if (imageBuffer.length > MAX_IMAGE_SIZE) {
      throw new Error(`Image size ${imageBuffer.length} bytes exceeds 4MB limit`);
    }

    const fileExt = tempImagePath.split('.').pop().toLowerCase();
    if (!VALID_IMAGE_TYPES.includes(fileExt)) {
      throw new Error(`Invalid image type: ${fileExt}`);
    }

    const permanentPath = `pictures/${username}.png`;
    let imageSha = null;

    try {
      const { data: existingImage } = await octokit.repos.getContent({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: permanentPath
      });
      imageSha = existingImage.sha;
    } catch {
      console.log('No existing image found, creating new.');
    }

    const saveResponse = await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: permanentPath,
      message: `Profile image for ${username}`,
      content: tempImage.content,
      sha: imageSha,
      branch: 'main'
    });

    await octokit.repos.deleteFile({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: tempImagePath,
      message: `Remove temp image for ${username}`,
      sha: tempImage.sha,
      branch: 'main'
    });

    return `/api/image-proxy?path=pictures/${username}.png&ts=${Date.now()}`;

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

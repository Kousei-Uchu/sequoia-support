import { Octokit } from '@octokit/rest';
import CryptoJS from 'crypto-js';
import { getToken } from 'next-auth/jwt';

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN,
  request: { fetch: require('node-fetch') }
});

// Constants
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB
const VALID_IMAGE_TYPES = ['png', 'jpeg', 'jpg'];

function generateUserKey(username) {
  return CryptoJS.SHA256(username + '-sequoia').toString();
}

function encryptData(data, key) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
}

async function validateAndMoveImage(tempImagePath, username) {
  try {
    // 1. Get temp image content
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

    // 2. Validate image content
    const imageBuffer = Buffer.from(tempImage.content, 'base64');
    
    // Check size
    if (imageBuffer.length > MAX_IMAGE_SIZE) {
      throw new Error(`Image size ${imageBuffer.length} bytes exceeds 2MB limit`);
    }

    // Check file type
    const fileExt = tempImagePath.split('.').pop().toLowerCase();
    if (!VALID_IMAGE_TYPES.includes(fileExt)) {
      throw new Error(`Invalid image type: ${fileExt}`);
    }

    // 3. Prepare permanent location
    const permanentPath = `pictures/${username}.png`;
    let imageSha = null;

    try {
      const { data: existingImage } = await octokit.repos.getContent({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: permanentPath
      });
      imageSha = existingImage.sha;
    } catch (error) {
      console.log('No existing image found, will create new');
    }

    // 4. Save to permanent location
    const saveResponse = await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: permanentPath,
      message: `Profile image for ${username}`,
      content: tempImage.content,
      sha: imageSha,
      branch: 'main'
    });

    console.log('Image saved successfully:', {
      path: permanentPath,
      sha: saveResponse.data.content.sha
    });

    // 5. Delete temp file
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

    // 1. Save profile data
    const profilePath = `profiles/${username}.json`;
    let profileSha = null;

    try {
      const { data: existingProfile } = await octokit.repos.getContent({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: profilePath
      });
      profileSha = existingProfile.sha;
    } catch (error) {
      // File doesn't exist yet
    }

    const profileResponse = await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: profilePath,
      message: `Update profile for ${username}`,
      content: Buffer.from(encrypted).toString('base64'),
      sha: profileSha,
      branch: 'main'
    });

    // 2. Process image if exists
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

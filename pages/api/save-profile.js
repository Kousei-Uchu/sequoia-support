import { Octokit } from '@octokit/rest';
import CryptoJS from 'crypto-js';
import { getToken } from 'next-auth/jwt';

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN,
  request: { fetch: require('node-fetch') }
});

// Constants
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const IMAGE_MAGIC_NUMBERS = {
  png: '89504e47',
  jpeg: ['ffd8ffe0', 'ffd8ffee']
};

function generateUserKey(username) {
  return CryptoJS.SHA256(username + '-sequoia').toString();
}

function encryptData(data, key) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
}

function validateImageContent(content) {
  try {
    const buffer = Buffer.from(content, 'base64');
    
    // Check size
    if (buffer.length > MAX_IMAGE_SIZE) {
      throw new Error(`Image exceeds maximum size of ${MAX_IMAGE_SIZE} bytes`);
    }

    // Check file type
    const hexStart = buffer.slice(0, 4).toString('hex');
    const isPNG = hexStart === IMAGE_MAGIC_NUMBERS.png;
    const isJPEG = IMAGE_MAGIC_NUMBERS.jpeg.includes(hexStart);
    
    if (!isPNG && !isJPEG) {
      throw new Error('Invalid image format (only PNG/JPEG allowed)');
    }

    return true;
  } catch (error) {
    console.error('Image validation failed:', error);
    throw error;
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

    // 1. First save the profile data
    const profilePath = `profiles/${username}.json`;
    let profileSha = null;
    let newProfileSha = null;

    try {
      // Get current file SHA if it exists
      const { data: existingProfile } = await octokit.repos.getContent({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: profilePath
      });
      profileSha = existingProfile.sha;
    } catch (error) {
      // File doesn't exist yet, that's fine
    }

    // Save profile data
    const profileResponse = await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: profilePath,
      message: `Update profile for ${username}`,
      content: Buffer.from(encrypted).toString('base64'),
      sha: profileSha,
      branch: 'main'
    });
    newProfileSha = profileResponse.data.content.sha;

    // 2. If there's a temp image, move it to permanent location
    if (tempImagePath) {
      try {
        const permanentImagePath = `pictures/${username}.png`;
        let imageSha = null;

        // Get current image SHA if it exists
        try {
          const { data: existingImage } = await octokit.repos.getContent({
            owner: process.env.GITHUB_REPO_OWNER,
            repo: process.env.GITHUB_REPO_NAME,
            path: permanentImagePath
          });
          imageSha = existingImage.sha;
        } catch (error) {
          // Image doesn't exist yet, that's fine
        }

        // Get the temp image content
        const { data: tempImage } = await octokit.repos.getContent({
          owner: process.env.GITHUB_REPO_OWNER,
          repo: process.env.GITHUB_REPO_NAME,
          path: tempImagePath
        });

        // Validate image before moving
        if (!tempImage.content) {
          throw new Error('Temp image has no content');
        }
        validateImageContent(tempImage.content);

        // Move to permanent location
        await octokit.repos.createOrUpdateFileContents({
          owner: process.env.GITHUB_REPO_OWNER,
          repo: process.env.GITHUB_REPO_NAME,
          path: permanentImagePath,
          message: `Profile image for ${username}`,
          content: tempImage.content,
          sha: imageSha,
          branch: 'main'
        });

        // Delete the temp file
        await octokit.repos.deleteFile({
          owner: process.env.GITHUB_REPO_OWNER,
          repo: process.env.GITHUB_REPO_NAME,
          path: tempImagePath,
          message: `Remove temp image for ${username}`,
          sha: tempImage.sha,
          branch: 'main'
        });

      } catch (imageError) {
        console.error('Image processing failed, reverting profile update:', imageError);
        
        // Revert profile update if image processing fails
        await octokit.repos.deleteFile({
          owner: process.env.GITHUB_REPO_OWNER,
          repo: process.env.GITHUB_REPO_NAME,
          path: profilePath,
          message: `Reverting profile update due to image save failure`,
          sha: newProfileSha,
          branch: 'main'
        });

        throw imageError;
      }
    }

    return res.status(200).json({
      success: true,
      photo: `https://github.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/raw/main/pictures/${username}.png?ts=${Date.now()}`
    });

  } catch (error) {
    console.error('Save profile error:', {
      message: error.message,
      request: error.request,
      response: error.response?.data,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    if (error.status === 403 && error.headers?.['x-ratelimit-remaining'] === '0') {
      return res.status(429).json({
        error: 'GitHub API rate limit exceeded',
        reset: new Date(error.headers['x-ratelimit-reset'] * 1000)
      });
    }

    return res.status(500).json({ 
      error: error.message || 'Failed to save profile',
      details: error.response?.data?.message
    });
  }
}

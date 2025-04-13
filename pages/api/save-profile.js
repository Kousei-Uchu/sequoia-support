import { Octokit } from '@octokit/rest';
import CryptoJS from 'crypto-js';
import { getToken } from 'next-auth/jwt';

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN,
  request: { fetch: require('node-fetch') }
});

// Constants (added)
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

function generateUserKey(username) {
  return CryptoJS.SHA256(username + '-sequoia').toString();
}

function encryptData(data, key) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
}

// New helper function
function validateImageContent(content) {
  const buffer = Buffer.from(content, 'base64');
  
  // Check size
  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error('Image exceeds maximum size of 2MB');
  }

  // Basic check for PNG/JPEG magic numbers
  const hexStart = buffer.slice(0, 4).toString('hex');
  if (!['89504e47', 'ffd8ffe0', 'ffd8ffee'].includes(hexStart)) {
    throw new Error('Invalid image format (only PNG/JPEG allowed)');
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

    // 1. Save profile data (unchanged)
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

    // 2. Handle image processing with validation
    if (tempImagePath) {
      try {
        // Get and validate temp image
        const { data: tempImage } = await octokit.repos.getContent({
          owner: process.env.GITHUB_REPO_OWNER,
          repo: process.env.GITHUB_REPO_NAME,
          path: tempImagePath
        });

        if (!tempImage.content) {
          throw new Error('Temp image has no content');
        }
        validateImageContent(tempImage.content);

        // Move to permanent location
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
          // Image doesn't exist yet
        }

        await octokit.repos.createOrUpdateFileContents({
          owner: process.env.GITHUB_REPO_OWNER,
          repo: process.env.GITHUB_REPO_NAME,
          path: permanentPath,
          message: `Profile image for ${username}`,
          content: tempImage.content,
          sha: imageSha,
          branch: 'main'
        });

        // Delete temp file
        await octokit.repos.deleteFile({
          owner: process.env.GITHUB_REPO_OWNER,
          repo: process.env.GITHUB_REPO_NAME,
          path: tempImagePath,
          message: `Remove temp image for ${username}`,
          sha: tempImage.sha,
          branch: 'main'
        });

      } catch (imageError) {
        console.error('Image processing failed:', imageError);
        throw new Error('Failed to process profile image');
      }
    }

    return res.status(200).json({
      success: true,
      photo: `/api/image-proxy?path=pictures/${username}.png&ts=${Date.now()}`
    });

  } catch (error) {
    console.error('Save profile error:', error);
    
    // Handle rate limits
    if (error.status === 403 && error.headers?.['x-ratelimit-remaining'] === '0') {
      return res.status(429).json({
        error: 'GitHub API rate limit exceeded',
        reset: new Date(error.headers['x-ratelimit-reset'] * 1000)
      });
    }

    return res.status(500).json({ 
      error: error.message || 'Failed to save profile',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

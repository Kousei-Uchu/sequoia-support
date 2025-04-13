import { Octokit } from '@octokit/rest';
import CryptoJS from 'crypto-js';
import { getToken } from 'next-auth/jwt';

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN,
  request: { fetch: require('node-fetch') }
});

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
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { profile, tempImagePath } = req.body;
    const username = token.username;
    const key = generateUserKey(username);
    const encrypted = encryptData(profile, key);

    // 1. First save the profile data
    const profilePath = `profiles/${username}.json`;
    let profileSha = null;

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

    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: profilePath,
      message: `Update profile for ${username}`,
      content: Buffer.from(encrypted).toString('base64'),
      sha: profileSha, // Include SHA if updating existing file
      branch: 'main'
    });

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

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Save profile error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to save profile',
      details: error.response?.data?.message
    });
  }
}

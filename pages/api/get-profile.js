import { Octokit } from '@octokit/rest';
import CryptoJS from 'crypto-js';

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN,
  request: { fetch: require('node-fetch') } // Ensures proper fetch implementation
});

function generateUserKey(username) {
  return CryptoJS.SHA256(username + '-sequoia').toString();
}

function decryptData(encrypted, key) {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

export default async function handler(req, res) {
  // Set secure, first-party cookies
  res.setHeader(
    'Set-Cookie',
    `profile_request=1; Path=/; HttpOnly; SameSite=Lax; Secure${process.env.NODE_ENV === 'production' ? '; Domain=sequoiasupport.vercel.app' : ''}`
  );

  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ 
      error: 'Username is required',
      cookies: req.headers.cookie // For debugging
    });
  }

  try {
    // Get profile data with cache control
    const { data: profileData } = await octokit.repos.getContent({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: `profiles/${username}.json`,
      headers: {
        'Cache-Control': 'no-cache' // Prevent GitHub caching
      }
    });

    const encrypted = Buffer.from(profileData.content, 'base64').toString('utf8');
    const key = generateUserKey(username);
    const profile = decryptData(encrypted, key);

    if (!profile) {
      return res.status(500).json({ error: 'Failed to decrypt profile' });
    }

    // Handle image URL with cache busting
    let imageUrl = '/default-avatar.png';
    try {
      await octokit.repos.getContent({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: `pictures/${username}.png`,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      // Use a backend-proxied URL instead of direct GitHub link
      imageUrl = `/api/image-proxy?user=${username}&ts=${Date.now()}`;
    } catch (error) {
      console.log('Using default avatar');
    }

    // Set proper cache headers for the response
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json({
      ...profile,
      photo: imageUrl,
      username
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    
    if (error.status === 404) {
      return res.status(404).json({ 
        error: 'Profile not found',
        details: `Check if ${username}.json exists in the repository`
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to load profile',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

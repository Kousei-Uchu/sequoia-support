import { Octokit } from '@octokit/rest'
import CryptoJS from 'crypto-js'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

function generateUserKey(username) {
  return CryptoJS.SHA256(username + '-sequoia').toString()
}

function decryptData(encrypted, key) {
  const bytes = CryptoJS.AES.decrypt(encrypted, key)
  const decrypted = bytes.toString(CryptoJS.enc.Utf8)
  return JSON.parse(decrypted)
}

export default async function handler(req, res) {
  const { username } = req.query

  if (!username) {
    return res.status(400).json({ error: 'Username is required' })
  }

  try {
    // Get the encrypted profile data
    const { data: profileData } = await octokit.repos.getContent({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: `profiles/${username}.json`
    })

    const encrypted = Buffer.from(profileData.content, 'base64').toString('utf8')
    const key = generateUserKey(username)
    const profile = decryptData(encrypted, key)

    // Get GitHub user data for the profile picture
    let githubProfile = {}
    try {
      const { data } = await octokit.users.getByUsername({ username })
      githubProfile = {
        avatar_url: data.avatar_url,
        html_url: data.html_url,
        name: data.name,
        bio: data.bio
      }
    } catch (error) {
      console.error('Failed to fetch GitHub profile:', error.message)
      // Fallback to our uploaded image if GitHub profile fails
      githubProfile.avatar_url = `https://raw.githubusercontent.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/main/pictures/${username}.png`
    }

    // Combine both profile data
    const response = {
      ...profile,
      github: githubProfile,
      // Maintain backward compatibility
      imageUrl: githubProfile.avatar_url
    }

    return res.status(200).json(response)
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: 'Profile not found' })
    }
    console.error('Profile fetch error:', error)
    return res.status(500).json({ 
      error: error.message,
      details: error.response?.data?.message || 'Unknown error occurred'
    })
  }
}

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
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: `profiles/${username}.json`
    })

    const encrypted = Buffer.from(data.content, 'base64').toString('utf8')
    const key = generateUserKey(username)
    const profile = decryptData(encrypted, key)

    return res.status(200).json(profile)
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: 'Profile not found' })
    }
    return res.status(500).json({ error: error.message })
  }
}

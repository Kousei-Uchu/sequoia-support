import { getToken } from 'next-auth/jwt'
import { Octokit } from '@octokit/rest'
import CryptoJS from 'crypto-js'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

function generateUserKey(username) {
  return CryptoJS.SHA256(username + '-sequoia').toString()
}

function encryptData(data, key) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const username = token.username || token.sub
  const key = generateUserKey(username)

  const encrypted = encryptData({
    ...req.body,
    username,
    lastUpdated: new Date().toISOString()
  }, key)

  const filePath = `profiles/${username}.json`
  const content = Buffer.from(encrypted).toString('base64')

  let sha
  try {
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: filePath
    })
    sha = data.sha
  } catch (error) {
    if (error.status !== 404) throw error
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: process.env.GITHUB_REPO_OWNER,
    repo: process.env.GITHUB_REPO_NAME,
    path: filePath,
    message: `Save encrypted profile for ${username}`,
    content,
    sha
  })

  res.status(200).json({ success: true })
}

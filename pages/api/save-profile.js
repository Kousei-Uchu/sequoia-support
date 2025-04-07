import { getToken } from 'next-auth/jwt'
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ 
  auth: process.env.GITHUB_TOKEN 
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'No valid session token found'
    })
  }

  try {
    if (!req.body.name || !req.body.about) {
      return res.status(400).json({ error: 'Name and about are required' })
    }

    const profileData = {
      ...req.body,
      username: token.username || token.sub,
      lastUpdated: new Date().toISOString()
    }

    const filePath = `profiles/${token.username || token.sub}.json`
    const message = `Update profile for ${token.username || token.sub}`
    const content = Buffer.from(JSON.stringify(profileData, null, 2)).toString('base64')

    // Try to get existing file SHA
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

    // Create or update file
    const result = await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: filePath,
      message: message,
      content: content,
      sha: sha
    })

    return res.status(200).json({ 
      success: true,
      url: `https://github.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/blob/main/${filePath}`
    })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ 
      error: 'Internal Server Error',
      details: error.message,
      ...(error.response && { githubError: error.response.data })
    })
  }
}

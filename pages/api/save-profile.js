import { Octokit } from '@octokit/rest'

export default async function handler(req, res) {
  const octokit = new Octokit({ 
    auth: process.env.GITHUB_TOKEN 
  })

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_DATA_REPO.split('/')[0],
      repo: process.env.GITHUB_DATA_REPO.split('/')[1],
      path: `profiles/${req.body.username}.json`,
      content: Buffer.from(JSON.stringify(req.body)).toString('base64'),
      message: `Update profile for ${req.body.username}`
    })
    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to save profile",
      details: error.message 
    })
  }
}

// pages/api/get-profile.js
export default async function handler(req, res) {
  let { username } = req.query
  username = username.toLowerCase() // Normalize to lowercase

  try {
    // First try exact match
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: `profiles/${username}.json`
      })
      const content = Buffer.from(data.content, 'base64').toString('utf8')
      return res.status(200).json(JSON.parse(content))
    } catch (exactError) {
      // If exact match fails, try case-insensitive search
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: 'profiles'
      })

      const matchingFile = data.find(file => 
        file.name.toLowerCase() === `${username}.json`.toLowerCase()
      )

      if (!matchingFile) throw new Error('Profile not found')

      const fileData = await octokit.repos.getContent({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: matchingFile.path
      })

      const content = Buffer.from(fileData.data.content, 'base64').toString('utf8')
      return res.status(200).json(JSON.parse(content))
    }
  } catch (error) {
    return res.status(404).json({ error: 'Profile not found' })
  }
}

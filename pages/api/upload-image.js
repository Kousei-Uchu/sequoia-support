import { Octokit } from "@octokit/rest";
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '4mb'
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get GitHub token from cookies or headers
    const authToken = req.headers.authorization?.split(' ')[1] || req.cookies['gh-token'];
    
    if (!authToken) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const octokit = new Octokit({ auth: authToken });

    // Get authenticated user's info
    const { data: user } = await octokit.users.getAuthenticated();
    const username = user.login;

    // Parse the uploaded file
    const form = new formidable.IncomingForm();
    const [_, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file[0];
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileName = `${username}.png`;
    const filePath = `pictures/${fileName}`;
    const fileData = fs.readFileSync(file.filepath);
    const fileContent = fileData.toString('base64');

    try {
      // Check if file exists to get SHA for update
      let sha;
      try {
        const { data } = await octokit.repos.getContent({
          owner: process.env.GITHUB_REPO_OWNER,
          repo: process.env.GITHUB_REPO_NAME,
          path: filePath,
          branch: 'main'
        });
        sha = data.sha;
      } catch (error) {
        if (error.status !== 404) throw error;
      }

      // Use the app's token for the actual upload (not user's token)
      const appOctokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
      
      await appOctokit.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: filePath,
        message: `Update profile image for ${username}`,
        content: fileContent,
        branch: 'main',
        sha: sha
      });

      fs.unlinkSync(file.filepath);

      const imageUrl = `https://raw.githubusercontent.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/main/${filePath}`;
      return res.status(200).json({ imageUrl });
    } catch (error) {
      console.error('GitHub API error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      message: 'Upload failed',
      error: error.message 
    });
  }
}

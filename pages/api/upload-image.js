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
    // Parse the form data
    const form = new formidable.IncomingForm();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file;
    const username = fields.username;
    
    // Always save as PNG for consistency
    const fileName = `${username}.png`;
    const filePath = `pictures/${fileName}`;

    // Read the file
    const fileData = fs.readFileSync(file.filepath);
    const fileContent = fileData.toString('base64');

    // Initialize Octokit
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    try {
      // Check if file exists first to get the SHA for update
      let sha;
      try {
        const existingFile = await octokit.repos.getContent({
          owner: process.env.GITHUB_REPO_OWNER,
          repo: process.env.GITHUB_REPO_NAME,
          path: filePath,
          branch: 'main'
        });
        sha = existingFile.data.sha;
      } catch (error) {
        // File doesn't exist yet, sha will remain undefined
        if (error.status !== 404) throw error;
      }

      // Upload to GitHub
      const response = await octokit.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: filePath,
        message: `Update profile image for ${username}`,
        content: fileContent,
        branch: 'main',
        sha: sha // Will be undefined for new files
      });

      // Clean up temporary file
      fs.unlinkSync(file.filepath);

      // Return the raw GitHub URL
      const imageUrl = `https://raw.githubusercontent.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/main/${filePath}`;

      res.status(200).json({ imageUrl });
    } catch (error) {
      console.error('GitHub API error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
}

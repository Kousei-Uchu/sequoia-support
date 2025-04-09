import { Octokit } from "@octokit/rest";
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

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
    const fileExt = file.originalFilename.split('.').pop();
    const fileName = `profile-${username}-${Date.now()}.${fileExt}`;

    // Read the file
    const fileData = fs.readFileSync(file.filepath);
    const fileContent = fileData.toString('base64');

    // Initialize Octokit
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    // Upload to GitHub
    const response = await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: `public/uploads/${fileName}`,
      message: `Upload profile image for ${username}`,
      content: fileContent,
      branch: 'main'
    });

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    // Return the raw GitHub URL
    const imageUrl = `https://raw.githubusercontent.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/main/public/uploads/${fileName}`;

    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
}

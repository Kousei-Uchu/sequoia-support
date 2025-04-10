import { Octokit } from "@octokit/rest";
import formidable from 'formidable';
import fs from 'fs';
import { getToken } from 'next-auth/jwt';

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
    // Get the authenticated user's token
    const token = await getToken({ req });
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const username = token.username; // Using token.username instead of GitHub API

    // Parse the uploaded file
    const form = formidable();
    const [_, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files?.file?.[0];
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file type and size
    if (!file.mimetype.startsWith('image/')) {
      fs.unlinkSync(file.filepath);
      return res.status(400).json({ message: 'Only image files are allowed' });
    }

    if (file.size > 4 * 1024 * 1024) { // 4MB
      fs.unlinkSync(file.filepath);
      return res.status(400).json({ message: 'File too large (max 4MB)' });
    }

    const fileName = `${username}.png`;
    const filePath = `pictures/${fileName}`;
    const fileData = fs.readFileSync(file.filepath);
    const fileContent = fileData.toString('base64');

    // Use app token for repository access
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

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

      // Upload the file
      await octokit.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_REPO_OWNER,
        repo: process.env.GITHUB_REPO_NAME,
        path: filePath,
        message: `Update profile image for ${username}`,
        content: fileContent,
        branch: 'main',
        sha: sha
      });

      // Clean up temporary file
      fs.unlinkSync(file.filepath);

      const imageUrl = `https://raw.githubusercontent.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/main/${filePath}`;
      return res.status(200).json({ 
        success: true,
        imageUrl,
        username
      });
    } catch (error) {
      console.error('GitHub API error:', error);
      if (error.status === 401) {
        return res.status(401).json({ 
          message: 'Repository access denied',
          error: 'Check your GITHUB_TOKEN permissions'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Upload failed',
      error: error.message,
      details: error.response?.data?.message || 'Unknown error'
    });
  }
}

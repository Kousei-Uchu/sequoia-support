// pages/api/upload-image.js
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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = await getToken({ req });
    if (!token?.username) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const username = token.username;
    const timestamp = Date.now();
    const tempFileName = `${username}-${timestamp}.png`;
    const tempFilePath = `pictures/temp/${tempFileName}`;

    // Parse and process the uploaded file
    const form = formidable({
      multiples: false,
      maxFileSize: 2 * 1024 * 1024,
      filename: () => tempFileName,
      filter: ({ mimetype }) => !!mimetype?.match(/^image\/(jpeg|png|webp)$/)
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files?.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Convert to PNG if needed and read file
    const fileBuffer = fs.readFileSync(file.filepath);
    const fileContent = fileBuffer.toString('base64');

    // Upload to temp location
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: tempFilePath,
      message: `Temp profile image for ${username}`,
      content: fileContent,
      branch: 'main'
    });

    // Clean up local temp file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      tempImageUrl: `https://raw.githubusercontent.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/main/${tempFilePath}`,
      tempFilePath // We'll need this to move the file later
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: error.message || 'Upload failed'
    });
  }
}

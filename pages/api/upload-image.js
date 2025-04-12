import { Octokit } from "@octokit/rest";
import formidable from 'formidable';
import fs from 'fs';
import { getToken } from 'next-auth/jwt';

export const config = {
  api: {
    bodyParser: false,  // Disable default body parsing
    sizeLimit: '4mb'
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = await getToken({ req });
    if (!token?.username) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const username = token.username;

    // Parse form data
    const form = formidable({
      multiples: false,
      maxFileSize: 2 * 1024 * 1024, // 2MB
      filter: ({ mimetype }) => {
        return !!mimetype?.match(/^image\/(jpeg|png|webp)$/);
      }
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parse error:', err);
          reject(err);
          return;
        }
        resolve([fields, files]);
      });
    });

    console.log('Parsed files:', files);

    const file = Array.isArray(files?.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify file exists
    if (!fs.existsSync(file.filepath)) {
      return res.status(400).json({ error: 'File not found' });
    }

    // Read file content
    const fileContent = fs.readFileSync(file.filepath, { encoding: 'base64' });
    const fileName = `${username}.${file.originalFilename.split('.').pop()}`;
    const filePath = `pictures/${fileName}`;

    // Initialize GitHub client
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // Check for existing file
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

    // Upload to GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: filePath,
      message: `Update profile image for ${username}`,
      content: fileContent,
      branch: 'main',
      sha: sha
    });

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      imageUrl: `https://raw.githubusercontent.com/${process.env.GITHUB_REPO_OWNER}/${process.env.GITHUB_REPO_NAME}/main/${filePath}`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: error.message || 'Upload failed',
      details: error.response?.data?.message
    });
  }
}

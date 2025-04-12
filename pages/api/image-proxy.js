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

    const form = formidable({
      multiples: false,
      maxFileSize: 2 * 1024 * 1024,
      filename: () => tempFileName,
      filter: ({ mimetype }) => {
        return !!mimetype?.match(/^image\/(jpeg|png|webp)$/);
      }
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            reject(new Error('File size must be less than 2MB'));
          } else if (err.message.includes('mimetype')) {
            reject(new Error('Only JPEG, PNG, or WEBP images are allowed'));
          } else {
            reject(err);
          }
          return;
        }
        resolve([fields, files]);
      });
    });

    const file = files?.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = fs.readFileSync(file.filepath);
    const fileContent = fileBuffer.toString('base64');

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      path: tempFilePath,
      message: `Temp profile image for ${username}`,
      content: fileContent,
      branch: 'main'
    });

    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      // Return the proxied URL instead of direct GitHub URL
      tempImageUrl: `/api/image-proxy?path=${encodeURIComponent(tempFilePath)}`,
      tempFilePath
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: error.message || 'Upload failed'
    });
  }
}

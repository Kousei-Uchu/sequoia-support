const Octokit = require('@octokit/rest').Octokit;

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export async function getProfile(username) {
  try {
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_DATA_REPO.split('/')[0],
      repo: process.env.GITHUB_DATA_REPO.split('/')[1],
      path: `profiles/${username}.json`,
    });
    return JSON.parse(Buffer.from(data.content, 'base64').toString());
  } catch (error) {
    throw new Error('Profile not found');
  }
}

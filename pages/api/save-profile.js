{\rtf1\ansi\ansicpg1252\cocoartf2821
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import \{ Octokit \} from '@octokit/rest';\
\
const octokit = new Octokit(\{ auth: process.env.GITHUB_TOKEN \});\
\
export default async function handler(req, res) \{\
  try \{\
    const \{ username \} = req.body;\
    \
    const response = await octokit.repos.createOrUpdateFileContents(\{\
      owner: process.env.GITHUB_DATA_REPO.split('/')[0],\
      repo: process.env.GITHUB_DATA_REPO.split('/')[1],\
      path: `profiles/$\{username\}.json`,\
      message: `Update profile for $\{username\}`,\
      content: Buffer.from(JSON.stringify(req.body)).toString('base64'),\
      sha: await getFileSha(username),\
    \});\
\
    res.status(200).json(\{ success: true \});\
  \} catch (error) \{\
    res.status(500).json(\{ error: error.message \});\
  \}\
\}\
\
async function getFileSha(username) \{\
  try \{\
    const \{ data \} = await octokit.repos.getContent(\{\
      owner: process.env.GITHUB_DATA_REPO.split('/')[0],\
      repo: process.env.GITHUB_DATA_REPO.split('/')[1],\
      path: `profiles/$\{username\}.json`,\
    \});\
    return data.sha;\
  \} catch \{\
    return null;\
  \}\
\}}
{\rtf1\ansi\ansicpg1252\cocoartf2821
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const API_BASE = 'https://api.github.com/repos';\
\
export async function getProfile(username) \{\
  const response = await fetch(\
    `$\{API_BASE\}/$\{process.env.NEXT_PUBLIC_DATA_REPO\}/contents/profiles/$\{username\}.json`,\
    \{\
      headers: \{\
        'Authorization': `token $\{process.env.NEXT_PUBLIC_GITHUB_TOKEN\}`,\
        'Accept': 'application/vnd.github.v3.raw',\
      \},\
    \}\
  );\
  \
  if (!response.ok) throw new Error('Profile not found');\
  return await response.json();\
\}\
\
export async function saveProfile(profileData) \{\
  const response = await fetch('/api/save-profile', \{\
    method: 'POST',\
    headers: \{\
      'Content-Type': 'application/json',\
    \},\
    body: JSON.stringify(profileData),\
  \});\
  \
  if (!response.ok) throw new Error('Failed to save profile');\
  return await response.json();\
\}}
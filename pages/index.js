{\rtf1\ansi\ansicpg1252\cocoartf2821
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import Head from 'next/head';\
import Link from 'next/link';\
\
export default function Home() \{\
  return (\
    <div className="container">\
      <Head>\
        <title>Sunflower Profiles</title>\
      </Head>\
\
      <main>\
        <h1>Welcome to Sunflower Profiles</h1>\
        <p>Create and share your hidden disabilities profile</p>\
        \
        <div className="actions">\
          <Link href="/editor">\
            <a className="btn">Create Your Profile</a>\
          </Link>\
          <Link href="/profile/example">\
            <a className="btn secondary">View Example</a>\
          </Link>\
        </div>\
      </main>\
\
      <style jsx>\{`\
        .container \{\
          min-height: 100vh;\
          padding: 0 2rem;\
        \}\
        .actions \{\
          margin-top: 2rem;\
        \}\
        .btn \{\
          display: inline-block;\
          margin-right: 1rem;\
          padding: 0.75rem 1.5rem;\
          background: #FFDB00;\
          color: #006341;\
          text-decoration: none;\
          border-radius: 4px;\
        \}\
        .secondary \{\
          background: #006341;\
          color: #FFDB00;\
        \}\
      `\}</style>\
    </div>\
  );\
\}}
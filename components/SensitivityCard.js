{\rtf1\ansi\ansicpg1252\cocoartf2821
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 export default function SensitivityCard(\{ icon, title, description \}) \{\
  return (\
    <div className="sensitivity-card">\
      <img \
        src=\{`/icons/$\{icon\}.png`\} \
        alt=\{title\} \
        className="sensitivity-icon"\
      />\
      <h3>\{title\}</h3>\
      <p>\{description\}</p>\
      \
      <style jsx>\{`\
        .sensitivity-card \{\
          padding: 20px;\
          text-align: center;\
          border-top: 3px solid var(--sunflower-yellow);\
        \}\
        .sensitivity-icon \{\
          width: 50px;\
          height: 50px;\
          object-fit: contain;\
          margin-bottom: 15px;\
        \}\
      `\}</style>\
    </div>\
  );\
\}}
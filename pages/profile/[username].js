{\rtf1\ansi\ansicpg1252\cocoartf2821
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import Head from 'next/head';\
import \{ useRouter \} from 'next/router';\
\
export default function ProfileViewer() \{\
  const router = useRouter();\
  const \{ username \} = router.query;\
\
  // In a real app, this would fetch from your private repo\
  const profile = \{\
    name: "Example User",\
    about: "This is an example profile. In the real app, this would be fetched from your private data repository.",\
    photo: "/images/default-avatar.png",\
    sensitivities: [\
      \{\
        icon: "sound",\
        title: "Sound Sensitivity",\
        description: "Loud or sudden noises can be overwhelming."\
      \}\
    ],\
    supports: [\
      \{\
        icon: "clock",\
        title: "Patience",\
        description: "I may need extra time to process information."\
      \}\
    ],\
    emergency: \{\
      contactName: "Emergency Contact",\
      contactNumber: "000-000-0000"\
    \}\
  \};\
\
  return (\
    <div className="profile-container">\
      <Head>\
        <title>\{profile.name\}'s Profile</title>\
      </Head>\
\
      <header className="sunflower-header">\
        <div className="header-content">\
          <img src="/sunflower_icon.png" alt="Sunflower" className="logo" />\
          <h1>\{profile.name\}'s Support Needs</h1>\
          <p>Understanding hidden disabilities</p>\
        </div>\
      </header>\
\
      <main>\
        <section className="about-section">\
          <div className="profile-content">\
            <div className="profile-text">\
              <h2><i className="fas fa-user"></i> About Me</h2>\
              <p>\{profile.about\}</p>\
            </div>\
            <div className="profile-image">\
              <img src=\{profile.photo\} alt=\{profile.name\} />\
            </div>\
          </div>\
        </section>\
\
        <section className="sensitivities">\
          <h2><i className="fas fa-exclamation-triangle"></i> My Sensitivities</h2>\
          <div className="grid">\
            \{profile.sensitivities.map((item, index) => (\
              <div key=\{index\} className="card">\
                <img src=\{`/icons/$\{item.icon\}.png`\} alt="" />\
                <h3>\{item.title\}</h3>\
                <p>\{item.description\}</p>\
              </div>\
            ))\}\
          </div>\
        </section>\
\
        <section className="supports">\
          <h2><i className="fas fa-hands-helping"></i> How You Can Support Me</h2>\
          <div className="support-list">\
            \{profile.supports.map((item, index) => (\
              <div key=\{index\} className="support-item">\
                <div className="icon">\
                  <i className=\{`fas fa-$\{item.icon\}`\}></i>\
                </div>\
                <div className="text">\
                  <h3>\{item.title\}</h3>\
                  <p>\{item.description\}</p>\
                </div>\
              </div>\
            ))\}\
          </div>\
        </section>\
\
        <section className="emergency">\
          <h2><i className="fas fa-first-aid"></i> Emergency Information</h2>\
          <p>In case I appear distressed or need urgent assistance:</p>\
          <ul>\
            <li>Remain calm and speak softly</li>\
            <li>Offer me a quiet space if possible</li>\
            <li>Contact \{profile.emergency.contactName\} at \{profile.emergency.contactNumber\}</li>\
          </ul>\
        </section>\
      </main>\
\
      <footer className="footer">\
        <p>Thank you for your understanding and support</p>\
        <img src="/sunflower_icon.png" alt="Sunflower" className="logo" />\
        <p className="small">Created with Sunflower Profiles</p>\
      </footer>\
\
      <style jsx>\{`\
        .profile-container \{\
          font-family: 'Open Sans', sans-serif;\
          max-width: 1200px;\
          margin: 0 auto;\
        \}\
        .sunflower-header \{\
          background: #006341;\
          color: #FFDB00;\
          padding: 2rem;\
          text-align: center;\
        \}\
        .grid \{\
          display: grid;\
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));\
          gap: 1rem;\
        \}\
        .card \{\
          background: white;\
          padding: 1rem;\
          border-radius: 8px;\
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);\
        \}\
        .support-item \{\
          display: flex;\
          gap: 1rem;\
          margin-bottom: 1rem;\
        \}\
        .icon \{\
          background: #FFDB00;\
          color: #006341;\
          width: 40px;\
          height: 40px;\
          border-radius: 50%;\
          display: flex;\
          align-items: center;\
          justify-content: center;\
        \}\
      `\}</style>\
    </div>\
  );\
\}}
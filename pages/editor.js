{\rtf1\ansi\ansicpg1252\cocoartf2821
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import \{ useState \} from 'react';\
import Head from 'next/head';\
\
export default function Editor() \{\
  const [profile, setProfile] = useState(\{\
    name: '',\
    about: '',\
    photo: '/images/default-avatar.png',\
    sensitivities: [],\
    supports: [],\
    emergency: \{\
      instructions: [],\
      contactName: '',\
      contactNumber: ''\
    \}\
  \});\
\
  const sensitivityOptions = [\
    \{ value: 'sound', label: 'Sound Sensitivity', icon: '/icons/sound.png' \},\
    \{ value: 'light', label: 'Light Sensitivity', icon: '/icons/light.png' \},\
    \{ value: 'crowd', label: 'Crowd Sensitivity', icon: '/icons/space.png' \},\
    \{ value: 'time', label: 'Processing Speed', icon: '/icons/time.png' \},\
    \{ value: 'carer', label: 'Support People', icon: '/icons/carer.png' \},\
    \{ value: 'safespace', label: 'Quiet Space', icon: '/icons/safespace.png' \},\
    \{ value: 'allergy', label: 'Food Allergies', icon: '/icons/allergy.png' \}\
  ];\
\
  const supportOptions = [\
    \{ value: 'patience', label: 'Patience', icon: 'clock' \},\
    \{ value: 'communication', label: 'Clear Communication', icon: 'volume-down' \},\
    \{ value: 'space', label: 'Quiet Spaces', icon: 'door-open' \},\
    \{ value: 'instructions', label: 'Clear Instructions', icon: 'list-alt' \}\
  ];\
\
  const handleSubmit = (e) => \{\
    e.preventDefault();\
    // Save logic will be added later\
    alert('Profile saved! (Implementation coming soon)');\
  \};\
\
  return (\
    <div className="editor-container">\
      <Head>\
        <title>Edit Your Profile</title>\
      </Head>\
\
      <form onSubmit=\{handleSubmit\}>\
        <section>\
          <h2>About You</h2>\
          <label>\
            Your Name:\
            <input\
              type="text"\
              value=\{profile.name\}\
              onChange=\{(e) => setProfile(\{...profile, name: e.target.value\})\}\
              required\
            />\
          </label>\
\
          <label>\
            About You:\
            <textarea\
              value=\{profile.about\}\
              onChange=\{(e) => setProfile(\{...profile, about: e.target.value\})\}\
              required\
            />\
          </label>\
\
          <label>\
            Profile Photo URL:\
            <input\
              type="text"\
              value=\{profile.photo\}\
              onChange=\{(e) => setProfile(\{...profile, photo: e.target.value\})\}\
              placeholder="/images/default-avatar.png"\
            />\
          </label>\
        </section>\
\
        <section>\
          <h2>Your Sensitivities</h2>\
          <div className="grid">\
            \{sensitivityOptions.map((option) => (\
              <label key=\{option.value\} className="card">\
                <input\
                  type="checkbox"\
                  checked=\{profile.sensitivities.some(s => s.icon === option.value)\}\
                  onChange=\{(e) => \{\
                    if (e.target.checked) \{\
                      setProfile(\{\
                        ...profile,\
                        sensitivities: [\
                          ...profile.sensitivities,\
                          \{\
                            icon: option.value,\
                            title: option.label,\
                            description: ''\
                          \}\
                        ]\
                      \});\
                    \} else \{\
                      setProfile(\{\
                        ...profile,\
                        sensitivities: profile.sensitivities.filter(\
                          s => s.icon !== option.value\
                        )\
                      \});\
                    \}\
                  \}\}\
                />\
                <img src=\{option.icon\} alt="" />\
                <span>\{option.label\}</span>\
              </label>\
            ))\}\
          </div>\
        </section>\
\
        <section>\
          <h2>Support Needs</h2>\
          <div className="grid">\
            \{supportOptions.map((option) => (\
              <label key=\{option.value\} className="card">\
                <input\
                  type="checkbox"\
                  checked=\{profile.supports.some(s => s.icon === option.value)\}\
                  onChange=\{(e) => \{\
                    if (e.target.checked) \{\
                      setProfile(\{\
                        ...profile,\
                        supports: [\
                          ...profile.supports,\
                          \{\
                            icon: option.icon,\
                            title: option.label,\
                            description: ''\
                          \}\
                        ]\
                      \});\
                    \} else \{\
                      setProfile(\{\
                        ...profile,\
                        supports: profile.supports.filter(\
                          s => s.icon !== option.value\
                        )\
                      \});\
                    \}\
                  \}\}\
                />\
                <i className=\{`fas fa-$\{option.icon\}`\}></i>\
                <span>\{option.label\}</span>\
              </label>\
            ))\}\
          </div>\
        </section>\
\
        <section>\
          <h2>Emergency Information</h2>\
          <label>\
            Emergency Contact Name:\
            <input\
              type="text"\
              value=\{profile.emergency.contactName\}\
              onChange=\{(e) => setProfile(\{\
                ...profile,\
                emergency: \{\
                  ...profile.emergency,\
                  contactName: e.target.value\
                \}\
              \})\}\
            />\
          </label>\
\
          <label>\
            Emergency Contact Number:\
            <input\
              type="tel"\
              value=\{profile.emergency.contactNumber\}\
              onChange=\{(e) => setProfile(\{\
                ...profile,\
                emergency: \{\
                  ...profile.emergency,\
                  contactNumber: e.target.value\
                \}\
              \})\}\
            />\
          </label>\
        </section>\
\
        <button type="submit">Save Profile</button>\
      </form>\
\
      <style jsx>\{`\
        .editor-container \{\
          max-width: 1200px;\
          margin: 0 auto;\
          padding: 2rem;\
        \}\
        .grid \{\
          display: grid;\
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));\
          gap: 1rem;\
        \}\
        .card \{\
          display: flex;\
          flex-direction: column;\
          align-items: center;\
          padding: 1rem;\
          border: 1px solid #ddd;\
          border-radius: 8px;\
          cursor: pointer;\
        \}\
        .card img, .card i \{\
          font-size: 2rem;\
          margin-bottom: 0.5rem;\
        \}\
        input[type="checkbox"] \{\
          display: none;\
        \}\
        input[type="checkbox"]:checked + img + span,\
        input[type="checkbox"]:checked + i + span \{\
          font-weight: bold;\
          color: #006341;\
        \}\
      `\}</style>\
    </div>\
  );\
\}}
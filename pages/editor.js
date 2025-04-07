import { useState } from 'react'
import Head from 'next/head'

export default function Editor() {
  const [profile, setProfile] = useState({
    name: '',
    about: '',
    photo: '/images/default-avatar.png',
    sensitivities: [],
    supports: []
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Save logic will be added
    alert('Profile saved!')
  }

  return (
    <div className="editor">
      <Head>
        <title>Edit Profile</title>
      </Head>
      <form onSubmit={handleSubmit}>
        {/* Form fields here */}
        <button type="submit">Save</button>
      </form>
    </div>
  )
}

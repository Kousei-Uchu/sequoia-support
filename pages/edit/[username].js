import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Header from '../../components/Header'
import { sensitivityOptions, supportOptions } from '../../lib/profileOptions'

function EditProfileComponent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { username } = router.query
  const [profile, setProfile] = useState({
  name: session?.user?.name || '',
  about: '',
  photo: session?.user?.image || 'https://example.com',
  sensitivities: [],
  supports: [],
  emergency: {
    contactName: '',
    contactNumber: '',
    instructions: []
  }
})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && session?.user?.username !== username) {
      router.push('/')
      return
    }

    const loadProfile = async () => {
  try {
    const res = await fetch(`/api/get-profile?username=${username}`)
    if (!res.ok) throw new Error('Failed to load profile')
    const data = await res.json()
    setProfile({
      name: data.name || session?.user?.name || '',
      about: data.about || '',
      photo: data.photo || session?.user?.image || 'https://example.com',
      sensitivities: data.sensitivities || [],
      supports: data.supports || [],
      emergency: data.emergency || {
        contactName: '',
        contactNumber: '',
        instructions: []
      }
    })
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

    if (status === 'authenticated') loadProfile()
  }, [session, status, username])

  const handleSave = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const response = await fetch('/api/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          username: session.user.username
        })
      })
      
      if (!response.ok) throw new Error(await response.text())
      router.push(`/profile/${session.user.username}`)
    } catch (err) {
      setError(err.message)
    }
  }

  const updateSensitivity = (id, field, value) => {
    setProfile(prev => ({
      ...prev,
      sensitivities: prev.sensitivities.map(item => 
        item.icon === id ? { ...item, [field]: value } : item
      )
    }))
  }

  const toggleSensitivity = (option) => {
    setProfile(prev => {
      const hasSensitivity = prev.sensitivities.some(s => s.icon === option.id)
      
      if (hasSensitivity) {
        return {
          ...prev,
          sensitivities: prev.sensitivities.filter(s => s.icon !== option.id)
        }
      } else {
        return {
          ...prev,
          sensitivities: [
            ...prev.sensitivities,
            {
              icon: option.id,
              title: option.label,
              description: ''
            }
          ]
        }
      }
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="editor-container">
        <Header />
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="editor-container">
        <Header />
        <div className="error">{error}</div>
      </div>
    )
  }

  return (
    <div className="editor-container">
      <Header />
      
      <form onSubmit={handleSave}>
        <section className="editor-section">
          <h2>About You</h2>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              value={profile.name}
              onChange={(e) => setProfile({...profile, name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>About You *</label>
            <textarea
              value={profile.about}
              onChange={(e) => setProfile({...profile, about: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Profile Photo URL</label>
            <input
              type="url"
              value={profile.photo}
              onChange={(e) => setProfile({...profile, photo: e.target.value})}
              placeholder="/images/default-avatar.png"
            />
          </div>
        </section>

        <section className="editor-section">
          <h2>My Sensitivities</h2>
          <div className="grid-3">
            {sensitivityOptions.map((option) => (
              <div key={option.id} className="card-toggle">
                <input
                  type="checkbox"
                  id={`sens-${option.id}`}
                  checked={profile.sensitivities.some(s => s.icon === option.id)}
                  onChange={() => toggleSensitivity(option)}
                />
                <label htmlFor={`sens-${option.id}`}>
                  <img src={option.icon} alt="" className="sensitivity-preview" />
                  <span>{option.label}</span>
                </label>
                
                {profile.sensitivities.some(s => s.icon === option.id) && (
                  <textarea
                    value={profile.sensitivities.find(s => s.icon === option.id)?.description || ''}
                    onChange={(e) => updateSensitivity(option.id, 'description', e.target.value)}
                    placeholder="Describe your needs..."
                    className="sensitivity-description"
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="editor-section">
          <h2>Support Needs</h2>
          <div className="grid-2">
            {supportOptions.map((option) => (
              <div key={option.id} className="card-toggle">
                <input
                  type="checkbox"
                  id={`supp-${option.id}`}
                  checked={profile.supports.some(s => s.icon === option.icon)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setProfile({
                        ...profile,
                        supports: [
                          ...profile.supports,
                          {
                            icon: option.icon,
                            title: option.label,
                            description: ''
                          }
                        ]
                      })
                    } else {
                      setProfile({
                        ...profile,
                        supports: profile.supports.filter(
                          s => s.icon !== option.icon
                        )
                      })
                    }
                  }}
                />
                <label htmlFor={`supp-${option.id}`}>
                  <i className={`fas fa-${option.icon}`}></i>
                  <span>{option.label}</span>
                </label>
                
                {profile.supports.some(s => s.icon === option.icon) && (
                  <textarea
                    value={profile.supports.find(s => s.icon === option.icon)?.description || ''}
                    onChange={(e) => 
                      setProfile({
                        ...profile,
                        supports: profile.supports.map(item => 
                          item.icon === option.icon 
                            ? { ...item, description: e.target.value } 
                            : item
                        )
                      })
                    }
                    placeholder="How can others help?"
                    className="support-description"
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="editor-section">
          <h2>Emergency Information</h2>
          <div className="form-group">
            <label>Emergency Contact Name</label>
            <input
              value={profile.emergency.contactName}
              onChange={(e) => setProfile({
                ...profile,
                emergency: {
                  ...profile.emergency,
                  contactName: e.target.value
                }
              })}
            />
          </div>
          
          <div className="form-group">
            <label>Emergency Contact Number</label>
            <input
              type="tel"
              value={profile.emergency.contactNumber}
              onChange={(e) => setProfile({
                ...profile,
                emergency: {
                  ...profile.emergency,
                  contactNumber: e.target.value
                }
              })}
            />
          </div>
        </section>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="save-btn">
          Save Profile
        </button>
      </form>
    </div>
  )
}

export default dynamic(() => Promise.resolve(EditProfileComponent), { 
  ssr: false,
  loading: () => (
    <div className="editor-container">
      <Header />
      <div className="loading">Loading editor...</div>
    </div>
  )
})

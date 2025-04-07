import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Header from '../../components/Header'
import SensitivityCard from '../../components/SensitivityCard'

export default function ProfilePage() {
  const router = useRouter()
  const { username } = router.query
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!username) return

    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/get-profile?username=${username}`)
        if (!res.ok) throw new Error('Profile not found')
        const data = await res.json()
        setProfile(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [username])

  if (loading) {
    return (
      <div className="profile-container">
        <Header />
        <div>Loading...</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="profile-container">
        <Header />
        <div className="error">{error || 'Profile not found'}</div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <Header />
      
      <main>
        <section className="about-section">
          <div className="profile-header">
            <img 
              src={profile.photo || '/images/default-avatar.png'} 
              alt={profile.name} 
              className="profile-avatar"
            />
            <h1>{profile.name}'s Support Profile</h1>
          </div>
          
          <div className="profile-bio">
            <p>{profile.about}</p>
          </div>
        </section>

        {profile.sensitivities.length > 0 && (
          <section className="sensitivities-section">
            <h2><i className="fas fa-exclamation-triangle"></i> My Sensitivities</h2>
            <div className="sensitivity-grid">
              {profile.sensitivities.map((item, index) => (
                <SensitivityCard
                  key={index}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                />
              ))}
            </div>
          </section>
        )}

        {profile.supports.length > 0 && (
          <section className="supports-section">
            <h2><i className="fas fa-hands-helping"></i> Support Needs</h2>
            <div className="support-list">
              {profile.supports.map((item, index) => (
                <div key={index} className="support-item">
                  <div className="support-icon">
                    <i className={`fas fa-${item.icon}`}></i>
                  </div>
                  <div className="support-text">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(profile.emergency.contactName || profile.emergency.contactNumber) && (
          <section className="emergency-section">
            <h2><i className="fas fa-first-aid"></i> Emergency Information</h2>
            <div className="emergency-content">
              <p>In case I appear distressed or need urgent assistance:</p>
              <ul>
                {profile.emergency.instructions.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
                {profile.emergency.contactName && profile.emergency.contactNumber && (
                  <li>Contact {profile.emergency.contactName} at {profile.emergency.contactNumber}</li>
                )}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

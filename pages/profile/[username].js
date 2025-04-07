import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import SensitivityCard from '../../components/SensitivityCard';

export default function ProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) return;

    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/get-profile?username=${username}`);
        if (!res.ok) throw new Error('Profile not found');
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="profile-container">
        <Header />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-container">
        <Header />
        <div className="error">{error || 'Profile not found'}</div>
      </div>
    );
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

        {profile.sensitivities?.length > 0 && (
          <section className="sensitivities-section">
            <h2><i className="fas fa-exclamation-triangle"></i> My Sensitivities</h2>
            <div className="sensitivity-grid">
              {profile.sensitivities.map((item) => (
                <SensitivityCard
                  key={item.icon}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                />
              ))}
            </div>
          </section>
        )}

        {profile.supports?.length > 0 && (
          <section className="supports-section">
            <h2><i className="fas fa-hands-helping"></i> Support Needs</h2>
            <div className="support-list">
              {profile.supports.map((item) => (
                <div key={item.icon} className="support-item">
                  <div className="support-icon">
                    {item.icon.startsWith('http') ? (
                      <img src={item.icon} alt={item.title} className="support-img" />
                    ) : (
                      <i className={`fas fa-${item.icon}`}></i>
                    )}
                  </div>
                  <div className="support-text">
                    <h3>{item.title}</h3>
                    {item.description && <p>{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(profile.emergency?.contacts?.length > 0 || profile.emergency?.instructions?.length > 0) && (
          <section className="emergency-section">
            <h2><i className="fas fa-first-aid"></i> Emergency Information</h2>
            <div className="emergency-content">
              <p>In case I appear distressed or need urgent assistance:</p>
              
              {profile.emergency.instructions?.length > 0 && (
                <div className="emergency-instructions">
                  <h3>Instructions:</h3>
                  <ul>
                    {profile.emergency.instructions.map((instruction, i) => (
                      <li key={i}>{instruction}</li>
                    ))}
                  </ul>
                </div>
              )}

              {profile.emergency.contacts?.length > 0 && (
                <div className="emergency-contacts">
                  <h3>Emergency Contacts:</h3>
                  <ul>
                    {profile.emergency.contacts.map((contact, i) => (
                      <li key={i}>
                        {contact.name}: {contact.number}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

import { useState } from 'react';
import { useRouter } from 'next/router';
import { defaultProfile, sensitivityOptions, supportOptions } from '../lib/profile';
import Header from '../components/Header';

export default function Editor() {
  const [profile, setProfile] = useState(defaultProfile);
  const router = useRouter();

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          username: profile.name.toLowerCase().replace(/\s+/g, '-')
        })
      });
      
      if (response.ok) {
        router.push(`/p/${profile.name.toLowerCase().replace(/\s+/g, '-')}`);
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const updateSensitivity = (id, field, value) => {
    setProfile(prev => ({
      ...prev,
      sensitivities: prev.sensitivities.map(item => 
        item.icon === id ? { ...item, [field]: value } : item
      )
    }));
  };

  return (
    <div className="editor-container">
      <Header />
      
      <form onSubmit={handleSave}>
        {/* Basic Info Section */}
        <section className="editor-section">
          <h2>About You</h2>
          <div className="form-group">
            <label>Full Name</label>
            <input
              value={profile.name}
              onChange={(e) => setProfile({...profile, name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>About You</label>
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

        {/* Sensitivities Section */}
        <section className="editor-section">
          <h2>My Sensitivities</h2>
          <div className="grid-3">
            {sensitivityOptions.map((option) => (
              <div key={option.id} className="card-toggle">
                <input
                  type="checkbox"
                  id={`sens-${option.id}`}
                  checked={profile.sensitivities.some(s => s.icon === option.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setProfile({
                        ...profile,
                        sensitivities: [
                          ...profile.sensitivities,
                          {
                            icon: option.id,
                            title: option.label,
                            description: defaultProfile.sensitivities
                              .find(s => s.icon === option.id)?.description || ""
                          }
                        ]
                      });
                    } else {
                      setProfile({
                        ...profile,
                        sensitivities: profile.sensitivities.filter(
                          s => s.icon !== option.id
                        )
                      });
                    }
                  }}
                />
                <label htmlFor={`sens-${option.id}`}>
                  <img src={option.icon} alt="" />
                  <span>{option.label}</span>
                </label>
                
                {profile.sensitivities.some(s => s.icon === option.id) && (
                  <textarea
                    value={profile.sensitivities.find(s => s.icon === option.id)?.description || ""}
                    onChange={(e) => updateSensitivity(option.id, 'description', e.target.value)}
                    placeholder="Describe your needs..."
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Support Needs Section */}
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
                            description: defaultProfile.supports
                              .find(s => s.icon === option.icon)?.description || ""
                          }
                        ]
                      });
                    } else {
                      setProfile({
                        ...profile,
                        supports: profile.supports.filter(
                          s => s.icon !== option.icon
                        )
                      });
                    }
                  }}
                />
                <label htmlFor={`supp-${option.id}`}>
                  <i className={`fas fa-${option.icon}`}></i>
                  <span>{option.label}</span>
                </label>
                
                {profile.supports.some(s => s.icon === option.icon) && (
                  <textarea
                    value={profile.supports.find(s => s.icon === option.icon)?.description || ""}
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
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Emergency Info Section */}
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

        <button type="submit" className="save-btn">
          Save Profile
        </button>
      </form>
    </div>
  );
}

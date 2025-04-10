import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { defaultProfile, sensitivityOptions, supportOptions } from '../lib/profile';
import Header from '../components/Header';

export default function Editor() {
  const [profile, setProfile] = useState({
    ...defaultProfile,
    emergency: {
      contacts: [
        { name: '', number: '' }
      ],
      instructions: []
    }
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
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

  // In your EditProfileComponent (frontend)
const handleFileUpload = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}` // Make sure you have this
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const result = await response.json();
    setProfile(prev => ({...prev, photo: result.imageUrl}));
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    setError(error.message);
    throw error;
  }
};

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const toggleSensitivity = (option) => {
    setProfile(prev => {
      const hasSensitivity = prev.sensitivities.some(s => s.icon === option.id);
      
      if (hasSensitivity) {
        return {
          ...prev,
          sensitivities: prev.sensitivities.filter(s => s.icon !== option.id)
        };
      } else {
        return {
          ...prev,
          sensitivities: [
            ...prev.sensitivities,
            {
              icon: option.id,
              title: option.label,
              description: option.defaultDescription || ""
            }
          ]
        };
      }
    });
  };

  const toggleSupport = (option) => {
    setProfile(prev => {
      const hasSupport = prev.supports.some(s => s.icon === option.icon);
      
      if (hasSupport) {
        return {
          ...prev,
          supports: prev.supports.filter(s => s.icon !== option.icon)
        };
      } else {
        return {
          ...prev,
          supports: [
            ...prev.supports,
            {
              icon: option.icon,
              title: option.label,
              description: option.defaultDescription || ""
            }
          ]
        };
      }
    });
  };

  const updateSensitivityDescription = (id, value) => {
    setProfile(prev => ({
      ...prev,
      sensitivities: prev.sensitivities.map(item => 
        item.icon === id ? { ...item, description: value } : item
      )
    }));
  };

  const updateSupportDescription = (icon, value) => {
    setProfile(prev => ({
      ...prev,
      supports: prev.supports.map(item => 
        item.icon === icon ? { ...item, description: value } : item
      )
    }));
  };

  const addEmergencyContact = () => {
    setProfile(prev => ({
      ...prev,
      emergency: {
        ...prev.emergency,
        contacts: [...prev.emergency.contacts, { name: '', number: '' }]
      }
    }));
  };

  const removeEmergencyContact = (index) => {
    setProfile(prev => {
      const newContacts = [...prev.emergency.contacts];
      newContacts.splice(index, 1);
      return {
        ...prev,
        emergency: {
          ...prev.emergency,
          contacts: newContacts
        }
      };
    });
  };

  const updateEmergencyContact = (index, field, value) => {
    setProfile(prev => {
      const newContacts = [...prev.emergency.contacts];
      newContacts[index] = {
        ...newContacts[index],
        [field]: value
      };
      return {
        ...prev,
        emergency: {
          ...prev.emergency,
          contacts: newContacts
        }
      };
    });
  };

  const addEmergencyInstruction = () => {
    setProfile(prev => ({
      ...prev,
      emergency: {
        ...prev.emergency,
        instructions: [...prev.emergency.instructions, ""]
      }
    }));
  };

  const removeEmergencyInstruction = (index) => {
    setProfile(prev => {
      const newInstructions = [...prev.emergency.instructions];
      newInstructions.splice(index, 1);
      return {
        ...prev,
        emergency: {
          ...prev.emergency,
          instructions: newInstructions
        }
      };
    });
  };

  const updateEmergencyInstruction = (index, value) => {
    setProfile(prev => {
      const newInstructions = [...prev.emergency.instructions];
      newInstructions[index] = value;
      return {
        ...prev,
        emergency: {
          ...prev.emergency,
          instructions: newInstructions
        }
      };
    });
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
            <label>Profile Photo</label>
            <div className="photo-upload-container">
              {profile.photo && (
                <img 
                  src={profile.photo} 
                  alt="Preview" 
                  className="photo-preview"
                />
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={triggerFileInput}
                className="upload-btn"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
              {uploadError && <div className="upload-error">{uploadError}</div>}
              {!profile.photo && (
                <p className="upload-hint">Max file size: 2MB (JPEG, PNG, GIF, WEBP)</p>
              )}
            </div>
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
                  onChange={() => toggleSensitivity(option)}
                />
                <label htmlFor={`sens-${option.id}`}>
                  <img src={option.icon} alt="" className="sensitivity-icon" />
                  <span>{option.label}</span>
                </label>
                
                {profile.sensitivities.some(s => s.icon === option.id) && (
                  <textarea
                    value={profile.sensitivities.find(s => s.icon === option.id)?.description || ""}
                    onChange={(e) => updateSensitivityDescription(option.id, e.target.value)}
                    placeholder="Describe your needs..."
                    className="sensitivity-description"
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
                  onChange={() => toggleSupport(option)}
                />
                <label htmlFor={`supp-${option.id}`}>
                  <i className={`fas fa-${option.icon}`}></i>
                  <span>{option.label}</span>
                </label>
                
                {profile.supports.some(s => s.icon === option.icon) && (
                  <textarea
                    value={profile.supports.find(s => s.icon === option.icon)?.description || ""}
                    onChange={(e) => updateSupportDescription(option.icon, e.target.value)}
                    placeholder="How can others help?"
                    className="support-description"
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Emergency Info Section */}
        <section className="editor-section">
          <h2>Emergency Information</h2>
          
          <div className="emergency-contacts">
            <h3>Emergency Contacts</h3>
            {profile.emergency.contacts.map((contact, index) => (
              <div key={index} className="contact-group">
                <div className="form-group">
                  <label>Contact Name</label>
                  <input
                    value={contact.name}
                    onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="tel"
                    value={contact.number}
                    onChange={(e) => updateEmergencyContact(index, 'number', e.target.value)}
                  />
                </div>
                {profile.emergency.contacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmergencyContact(index)}
                    className="remove-contact"
                  >
                    Remove Contact
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addEmergencyContact}
              className="add-contact"
            >
              + Add Another Contact
            </button>
          </div>

          <div className="emergency-instructions">
            <h3>Emergency Instructions</h3>
            {profile.emergency.instructions.map((instruction, index) => (
              <div key={index} className="instruction-item">
                <input
                  type="text"
                  value={instruction}
                  onChange={(e) => updateEmergencyInstruction(index, e.target.value)}
                  placeholder="e.g., Remain calm and speak softly"
                />
                <button
                  type="button"
                  onClick={() => removeEmergencyInstruction(index)}
                  className="remove-instruction"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addEmergencyInstruction}
              className="add-instruction"
            >
              + Add Instruction
            </button>
          </div>
        </section>

        <button type="submit" className="save-btn">
          Save Profile
        </button>
      </form>
    </div>
  );
}

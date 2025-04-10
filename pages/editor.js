import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { defaultProfile, sensitivityOptions, supportOptions } from '../lib/profile';
import Header from '../components/Header';

export default function Editor() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef(null);

  // Initialize profile state
  const [profile, setProfile] = useState({
    ...defaultProfile,
    emergency: {
      contacts: [{ name: '', number: '' }],
      instructions: []
    }
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      loadProfile();
    }
  }, [status, router]);

  // Load existing profile data
  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/get-profile?username=${session.user.username}`);
      if (!response.ok) throw new Error('Failed to load profile');
      
      const data = await response.json();
      setProfile(prev => ({
        ...prev,
        ...data,
        photo: data.photo || session.user.image || '/default-avatar.png'
      }));
    } catch (error) {
      console.error('Profile load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError(null);
    
    if (!session?.user?.username) {
      setSaveError('User session not available');
      return;
    }

    try {
      const response = await fetch('/api/save-profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          ...profile,
          username: session.user.username
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save profile');
      }

      router.push(`/p/${session.user.username}`);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveError(error.message);
    }
  };

  // Handle file upload
    const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadError('Please select a file first');
      return;
    }

    // Client-side validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validTypes.includes(file.type)) {
      setUploadError('Only JPEG, PNG, or WEBP images are allowed');
      e.target.value = '';
      return;
    }

    if (file.size > maxSize) {
      setUploadError('File size must be less than 2MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('username', session.user.username);

      console.log('Uploading file:', file.name, file.size, file.type);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Upload failed');
      }

      const result = await response.json();
      
      if (!result?.imageUrl) {
        throw new Error('Invalid response from server');
      }

      setProfile(prev => ({...prev, photo: result.imageUrl}));
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'File upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Helper functions for profile sections
  const toggleSensitivity = (option) => {
    setProfile(prev => {
      const hasSensitivity = prev.sensitivities.some(s => s.icon === option.id);
      return {
        ...prev,
        sensitivities: hasSensitivity
          ? prev.sensitivities.filter(s => s.icon !== option.id)
          : [...prev.sensitivities, {
              icon: option.id,
              title: option.label,
              description: option.defaultDescription || ""
            }]
      };
    });
  };

  const toggleSupport = (option) => {
    setProfile(prev => {
      const hasSupport = prev.supports.some(s => s.icon === option.icon);
      return {
        ...prev,
        supports: hasSupport
          ? prev.supports.filter(s => s.icon !== option.icon)
          : [...prev.supports, {
              icon: option.icon,
              title: option.label,
              description: option.defaultDescription || ""
            }]
      };
    });
  };

  const updateDescription = (type, id, value) => {
    setProfile(prev => ({
      ...prev,
      [type]: prev[type].map(item => 
        item.icon === id ? { ...item, description: value } : item
      )
    }));
  };

  const updateEmergencyContacts = (index, field, value) => {
    setProfile(prev => {
      const newContacts = [...prev.emergency.contacts];
      newContacts[index] = { ...newContacts[index], [field]: value };
      return {
        ...prev,
        emergency: { ...prev.emergency, contacts: newContacts }
      };
    });
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
    setProfile(prev => ({
      ...prev,
      emergency: {
        ...prev.emergency,
        contacts: prev.emergency.contacts.filter((_, i) => i !== index)
      }
    }));
  };

  const updateEmergencyInstructions = (index, value) => {
    setProfile(prev => {
      const newInstructions = [...prev.emergency.instructions];
      newInstructions[index] = value;
      return {
        ...prev,
        emergency: { ...prev.emergency, instructions: newInstructions }
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
    setProfile(prev => ({
      ...prev,
      emergency: {
        ...prev.emergency,
        instructions: prev.emergency.instructions.filter((_, i) => i !== index)
      }
    }));
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="editor-container">
        <Header />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <Header />
      
      <form onSubmit={handleSave}>
        {saveError && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            {saveError}
          </div>
        )}

        {/* About You Section */}
        <section className="editor-section">
          <h2>About You</h2>
          
          <div className="form-group">
            <label>Full Name *</label>
            <input
              value={profile.name}
              onChange={(e) => setProfile({...profile, name: e.target.value})}
              required
              minLength={2}
            />
          </div>
          
          <div className="form-group">
            <label>About You *</label>
            <textarea
              value={profile.about}
              onChange={(e) => setProfile({...profile, about: e.target.value})}
              required
              minLength={10}
            />
          </div>
          
          <div className="form-group">
            <label>Profile Photo</label>
            <div className="photo-upload-container">
              <img 
                src={profile.photo} 
                alt="Profile" 
                className="photo-preview"
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/jpeg, image/png, image/webp"
                style={{ display: 'none' }}
                disabled={uploading}
                id="profile-upload-input"  // Added ID for better debugging
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="upload-btn"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner"></span>
                    Uploading...
                  </>
                ) : (
                  'Upload Photo'
                )}
              </button>
              
              {uploadError && (
                <div className="upload-error">
                  <i className="fas fa-exclamation-circle"></i>
                  {uploadError}
                </div>
              )}
              
              <p className="upload-hint">
                Recommended: Square image (500x500px) in JPEG, PNG, or WEBP format (max 2MB)
              </p>
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
                    onChange={(e) => updateDescription('sensitivities', option.id, e.target.value)}
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
                    onChange={(e) => updateDescription('supports', option.icon, e.target.value)}
                    placeholder="How can others help?"
                    className="support-description"
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Emergency Information Section */}
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
                    onChange={(e) => updateEmergencyContacts(index, 'name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="tel"
                    value={contact.number}
                    onChange={(e) => updateEmergencyContacts(index, 'number', e.target.value)}
                  />
                </div>
                {profile.emergency.contacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmergencyContact(index)}
                    className="remove-contact"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addEmergencyContact}
              className="add-contact"
            >
              + Add Contact
            </button>
          </div>

          <div className="emergency-instructions">
            <h3>Emergency Instructions</h3>
            {profile.emergency.instructions.map((instruction, index) => (
              <div key={index} className="instruction-item">
                <input
                  type="text"
                  value={instruction}
                  onChange={(e) => updateEmergencyInstructions(index, e.target.value)}
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

        <button 
          type="submit" 
          className="save-btn"
          disabled={uploading}
        >
          {uploading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}

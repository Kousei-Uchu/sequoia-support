import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Header from '../../components/Header';

export default function EditProfile() {
  const { data: session } = useSession();
  const router = useRouter();
  const { username } = router.query;
  const [profile, setProfile] = useState(null);

  // Redirect if not owner
  useEffect(() => {
    if (session?.user?.username !== username) {
      router.push('/');
    }
  }, [session, username]);

  useEffect(() => {
    if (username) {
      fetch(`/api/get-profile?username=${username}`)
        .then(res => res.json())
        .then(setProfile);
    }
  }, [username]);

  const handleSave = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/save-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    
    if (response.ok) {
      router.push(`/profile/${username}`);
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="editor-container">
      <Header />
      
      <form onSubmit={handleSave}>
        {/* Your existing editor form */}
        <button type="submit" className="save-btn">
          Save Profile
        </button>
      </form>
    </div>
  );
}

// pages/setup.js
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function UsernameSetup() {
  const { data: session, update } = useSession();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/set-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      await update({
        ...session,
        user: {
          ...session.user,
          username,
          usernameSet: true
        }
      });
      
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Choose Your Username</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          pattern="[a-z0-9_-]{3,20}"
          required
        />
        <button type="submit">Continue</button>
        {error && <p>{error}</p>}
      </form>
    </div>
  );
}

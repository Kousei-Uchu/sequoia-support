import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="sunflower-header">
      <div className="header-content">
        <Link href="/">
          <a>
            <img
              src="/sunflower_icon.png"
              alt="Hidden Disabilities Sunflower"
              className="sunflower-logo"
            />
          </a>
        </Link>
        <h1 className="header-text">My Support Needs</h1>
        <p className="tagline">Understanding my hidden disabilities</p>
        
        <div className="auth-actions">
          {session ? (
            <>
              <Link href={`/profile/${session.user.username}`}>
                <a className="auth-btn">
                  <img
                    src={session.user.image}
                    alt="User Avatar"
                    className="user-avatar"
                  />
                  My Profile
                </a>
              </Link>
              <button onClick={() => signOut()} className="auth-btn">
                Sign Out
              </button>
            </>
          ) : (
            <button onClick={() => signIn('github')} className="auth-btn">
              <i className="fab fa-github"></i> Sign In with GitHub
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

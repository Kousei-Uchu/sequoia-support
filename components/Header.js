import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Header() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrolled])

  if (!mounted || status === 'loading') {
    return (
      <header className={`sequoia-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-content">
          <Link href="/" legacyBehavior>
            <a>
              <img
                src="/sequoia-logo.png"
                alt="Sequoia Support"
                className="sequoia-logo"
              />
            </a>
          </Link>
          <h1 className="header-text">My Support Needs</h1>
          <div className="auth-actions">
            <div className="auth-btn">Loading...</div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className={`sequoia-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        <Link href="/" legacyBehavior>
          <a className="logo-link">
            <img
              src="/sequoia_icon.png"
              alt="Sequoia Support"
              className="sequoia-logo"
            />
            <div className="header-text-container">
              <h1 className="header-text">Sequoia Support</h1>
              <p className="tagline">Supporting hidden disabilities</p>
            </div>
          </a>
        </Link>
        
        <div className="auth-actions">
          {session ? (
            <>
              <Link href={`/profile/${session.user.username}`} legacyBehavior>
                <a className="auth-btn profile-btn">
                  <img
                    src={session.user.image}
                    alt="User Avatar"
                    className="user-avatar"
                  />
                  <span className="btn-text">My Profile</span>
                </a>
              </Link>
              <button onClick={() => signOut()} className="auth-btn signout-btn">
                <span className="btn-text">Sign Out</span>
              </button>
            </>
          ) : (
            <button onClick={() => signIn('github')} className="auth-btn signin-btn">
              <i className="fab fa-github"></i>
              <span className="btn-text">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

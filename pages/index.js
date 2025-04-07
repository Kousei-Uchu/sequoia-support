import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'

export default function Home() {
  return (
    <div className="home-container">
      <Head>
        <title>Sequoia Support Profiles</title>
        <meta name="description" content="Create and share your support profile" />
      </Head>
      
      <Header />
      
      <main className="home-main">
        <div className="hero-section">
          <img 
            src="/sequoia_icon.png" 
            alt="Sequoia Logo" 
            className="hero-logo"
          />
          <h1>Welcome to Sequoia Profiles</h1>
          <p className="subtitle">
            Create and share your support needs with a beautiful sequoia profile
          </p>
          <Link href="/editor" legacyBehavior>
            <a className="btn btn-primary">
              Create Your Profile
            </a>
          </Link>
        </div>
        
        <div className="features-section">
          <div className="feature-card">
            <i className="fas fa-user-shield feature-icon"></i>
            <h3>Share Your Needs</h3>
            <p>Easily communicate your sensitivities and support requirements</p>
          </div>
          
          <div className="feature-card">
            <i className="fas fa-heart feature-icon"></i>
            <h3>Emergency Info</h3>
            <p>Keep important contact information accessible</p>
          </div>
          
          <div className="feature-card">
            <i className="fas fa-lock feature-icon"></i>
            <h3>Privacy Focused</h3>
            <p>You control what information you share</p>
          </div>
        </div>
      </main>
      
      <footer className="sequoia-footer">
        <p>© {new Date().getFullYear()} Sequoia Profiles</p>
      </footer>
    </div>
  )
}

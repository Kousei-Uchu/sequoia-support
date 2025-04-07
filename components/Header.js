import Link from 'next/link';

export default function Header() {
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
      </div>
    </header>
  );
}

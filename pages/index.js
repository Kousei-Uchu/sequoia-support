import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>Sunflower Profiles</title>
      </Head>
      <main>
        <h1>Welcome to Sunflower Profiles</h1>
        <Link href="/editor">
          <a className="btn">Create Your Profile</a>
        </Link>
      </main>
    </div>
  )
}

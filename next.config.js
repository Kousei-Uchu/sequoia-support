/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    domains: ['raw.githubusercontent.com'],
  },
  async rewrites() {
    return [
      {
        source: '/p/:username',
        destination: '/profile/:username',
      }
    ]
  }
}

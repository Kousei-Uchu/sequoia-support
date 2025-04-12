/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    domains: ['github.com'],
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

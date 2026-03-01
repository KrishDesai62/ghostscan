/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for canvas in AttackGraph
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }]
    return config
  },
}
module.exports = nextConfig

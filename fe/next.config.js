// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow loading images from Cloudinary
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        // optional: pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
    // For compatibility with older Next.js versions
    domains: ['res.cloudinary.com', 'picsum.photos'],
  },
  // Other Next.js config options can be added here
};

module.exports = nextConfig;

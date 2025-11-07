/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        port: '',
        pathname: '/w40/**',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
        port: '',
        pathname: '/s2/favicons**',
      },
      {
        protocol: 'https',
        hostname: 'www.tradingview.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.fastbull.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.forexfactory.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'statics.fxstreet.com',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'www.fxreplay.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true
      },
      {
        source: '/team',
        destination: '/settings/companies',
        permanent: true
      },
      {
        source: '/team/myCompanies',
        destination: '/settings/companies',
        permanent: true
      },
      {
        source: '/team/add-member',
        destination: '/settings/companies',
        permanent: true
      },
      {
        source: '/team/add-company',
        destination: '/settings/companies/team/add-company',
        permanent: true
      },
      {
        source: '/team/generateReports',
        destination: '/settings/companies/team/generateReports',
        permanent: true
      },
      {
        source: '/team/:id/add-member',
        destination: '/settings/companies/team/:id/add-member',
        permanent: true
      },
      {
        source: '/team/:id',
        destination: '/settings/companies/team/:id',
        permanent: true
      },
      {
        source: '/services/:serviceId',
        destination: '/service-notifications/:serviceId',
        permanent: false
      },
      {
        source: '/client-portal/services/:serviceId',
        destination: '/service-notifications/:serviceId',
        permanent: false
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },

  // Em produção, ajustar isso
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'aquatechybeta.s3.amazonaws.com'
  //     },
  //     {
  //       protocol: 'https',
  //       hostname: 'via.placeholder.com'
  //     }
  //   ]
  // },
  env: {
    API_URL: process.env.API_URL,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  },
  pageExtensions: ['ts', 'tsx']
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["puppeteer-core", "pg", "nodemailer"],
  },
};

module.exports = nextConfig;

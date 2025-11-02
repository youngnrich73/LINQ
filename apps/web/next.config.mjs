/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "profiles.googleusercontent.com" }
    ]
  },
  transpilePackages: ["@linq/ui"]
};

export default nextConfig;

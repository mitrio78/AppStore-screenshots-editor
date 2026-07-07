/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: "standalone",
};

export default nextConfig;

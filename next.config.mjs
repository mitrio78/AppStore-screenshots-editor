/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Self-contained server bundle only for Docker image builds (the Dockerfile
  // sets STANDALONE=1). Local production runs use plain `next start`, which is
  // incompatible with standalone output.
  ...(process.env.STANDALONE === "1" ? { output: "standalone" } : {}),
};

export default nextConfig;

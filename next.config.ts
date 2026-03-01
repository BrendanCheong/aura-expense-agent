import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // node-appwrite uses `instanceof` checks internally (e.g. in Query serialization)
  // that break when Turbopack bundles the module. Keep it as an external package
  // so Node.js loads it natively and instanceof works correctly.
  serverExternalPackages: ['node-appwrite'],
};

export default nextConfig;

import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone',
  outputFileTracingExcludes: { '/*': ['./data/**/*', './backups/**/*', './.env*'] },
};
export default config;

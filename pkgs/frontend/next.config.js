/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TypeScriptのエラーは本番環境でも無視しない
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLintのエラーは本番環境でも無視しない
    ignoreDuringBuilds: false,
  },
  env: {
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET,
    NEXT_PUBLIC_ZKNFT_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_ZKNFT_CONTRACT_ADDRESS,
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  },
  experimental: {
    turbo: {
      // TurboPack設定（必要に応じて）
    },
  },
};

module.exports = nextConfig;

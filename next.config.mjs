/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ["tesseract.js"], 
  },
  api: {
    bodyParser: false,
  },
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    AUTO_KENT_DEBUG: "false",
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Add process polyfill
    config.resolve.alias = {
      ...config.resolve.alias,
      process: "process/browser",
    };

    // Handle pdf-parse library
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        "pdf-parse": "commonjs pdf-parse",
      });
    }

    // Handle Tesseract.js worker
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: {
        loader: "worker-loader",
        options: {
          filename: "static/[hash].worker.js",
          publicPath: "/_next/",
        },
      },
    });

    return config;
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/facilitators/login',
        destination: '/login/facilitator',
        permanent: true,
      },
    ];
  },

  // Keep pdfkit as a true Node require() — don't bundle it through webpack.
  // This preserves its file-system access to AFM font data.
  serverExternalPackages: ["pdfkit"],

  // Also ensure Vercel traces pdfkit's data files into the deployment
  outputFileTracingIncludes: {
    "/api/reports/generate": ["./node_modules/pdfkit/js/data/**"],
    "/api/hub/sign": ["./node_modules/pdfkit/js/data/**"],
    "/api/org/reports/generate": ["./node_modules/pdfkit/js/data/**"],
  },
};

export default nextConfig;

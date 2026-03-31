import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/facilitators/login',
        destination: '/login/facilitator',
        permanent: true,
      },
      // Canonical: redirect bare domain to www so POST bodies are never dropped
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'tripillarstudio.com' }],
        destination: 'https://www.tripillarstudio.com/:path*',
        permanent: false, // 307 — preserves POST method
      },
    ];
  },

  // Keep pdfkit as a true Node require() — don't bundle it through webpack.
  // This preserves its file-system access to AFM font data.
  serverExternalPackages: ["pdfkit"],

  // Also ensure Vercel traces pdfkit's data files into the deployment
  outputFileTracingIncludes: {
    "/api/reports/generate":         ["./node_modules/pdfkit/js/data/**"],
    "/api/hub/sign":                 ["./node_modules/pdfkit/js/data/**"],
    "/api/org/reports/generate":     ["./node_modules/pdfkit/js/data/**"],
    "/api/hub/cohorts":              ["./node_modules/pdfkit/js/data/**"],
    "/api/org/cohorts":              ["./node_modules/pdfkit/js/data/**"],
    "/api/admin/agreements":         ["./node_modules/pdfkit/js/data/**"],
    "/api/hub/cohort-outcomes":           ["./node_modules/pdfkit/js/data/**"],
    "/api/org/generate-report":           ["./node_modules/pdfkit/js/data/**"],
    "/api/hub/cohorts/[id]/complete":     ["./node_modules/pdfkit/js/data/**"],
  },
};

export default withSentryConfig(nextConfig, {
  org:     "tri-pillars-llc",
  project: "tripillarstudio",

  // Suppress Sentry CLI output in CI/build logs
  silent:  !process.env.CI,

  // Automatically tree-shake Sentry debug logging in production
  disableLogger: true,

  // Automatically add performance instrumentation to Server Components
  automaticVercelMonitors: true,

  // Upload source maps to Sentry for readable stack traces
  // Requires SENTRY_AUTH_TOKEN in Vercel env vars
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});

import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SpeedInsights } from "@vercel/speed-insights/next";
import JsonLd from "@/components/JsonLd";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tripillarstudio.com"),
  title: "Tri-Pillars™ | Live and Grieve™",
  description:
    "A community-based grief support program that meets people where they are, not where they're supposed to be.",
  keywords: "grief support, grief program, Live and Grieve, Tri-Pillars, grief counseling, bereavement",
  verification: {
    google: "l1ap_cwrU8ELfmwUniMNyh2LBkINdaSRIHnukUILEgs",
  },
  openGraph: {
    title: "Tri-Pillars™ | Live and Grieve™",
    description:
      "A community-based grief support program that meets people where they are, not where they're supposed to be.",
    url: "https://tripillarstudio.com",
    siteName: "Tri-Pillars™",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Live and Grieve™ — Structured Grief Education",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tri-Pillars™ | Live and Grieve™",
    description:
      "A community-based grief support program that meets people where they are, not where they're supposed to be.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://tripillarstudio.com",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Tri-Pillars™ LLC",
  "url": "https://tripillarstudio.com",
  "logo": "https://tripillarstudio.com/logo.png",
  "description": "Tri-Pillars™ LLC operates Live and Grieve™, a 52-week peer-facilitated grief education program that draws on five research frameworks and the Wolfelt companioning philosophical influence.",
  "foundingDate": "2024",
  "founders": [
    { "@type": "Person", "name": "Wayne Simms" },
    { "@type": "Person", "name": "Jamie Simms" }
  ],
  "sameAs": [
    "https://www.linkedin.com/company/tri-pillars-llc",
    "https://www.youtube.com/@liveandgrieve_3"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "wayne@tripillarstudio.com"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <JsonLd schema={organizationSchema} />
      </head>
      <body className="bg-background text-foreground min-h-screen">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}

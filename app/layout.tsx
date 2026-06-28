import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/shared/Toaster";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://careersetu.in";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "CareerSetu — AI Mock Interview Practice for India",
    template: "%s | CareerSetu",
  },
  description:
    "Practice mock interviews in English or Hindi with AI. Get honest, structured feedback for SSC, Bank PO, software engineer, and other roles. Free to start — no credit card needed.",
  keywords: [
    "AI mock interview",
    "mock interview practice India",
    "interview preparation Hindi",
    "SSC interview preparation",
    "Bank PO interview practice",
    "software engineer interview prep",
    "AI interview feedback",
    "CareerSetu",
  ],
  authors: [{ name: "CareerSetu", url: BASE_URL }],
  creator: "CareerSetu",
  publisher: "CareerSetu",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "CareerSetu",
    title: "CareerSetu — AI Mock Interview Practice for India",
    description:
      "Practice mock interviews in English or Hindi with AI. Get honest, structured feedback for SSC, Bank PO, software engineer, and other roles.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "CareerSetu — AI Mock Interview Practice",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CareerSetu — AI Mock Interview Practice for India",
    description:
      "Practice mock interviews in English or Hindi with AI. Honest, calibrated feedback for SSC, Bank PO, tech, and more.",
    images: ["/opengraph-image"],
    creator: "@careersetu",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: BASE_URL,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://supabase.co" />
        {/* Anti-flash: apply dark class before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('careersetu-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

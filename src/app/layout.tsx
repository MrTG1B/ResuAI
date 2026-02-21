
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

const BASE_URL = 'https://resuai.web.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'ResuAI – AI Resume Builder, ATS Checker & Portfolio Generator',
    template: '%s | ResuAI',
  },
  description:
    'Build a job-winning resume, check ATS compatibility, generate a stunning portfolio, and write personalized cover letters — all powered by AI. Free to get started.',
  keywords: [
    'AI resume builder',
    'ATS resume checker',
    'AI portfolio generator',
    'cover letter generator',
    'resume analyzer',
    'interview prep AI',
    'ResuAI',
    'job application tools',
    'career tools',
  ],
  authors: [{ name: 'ResuAI' }],
  creator: 'ResuAI',
  publisher: 'ResuAI',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'ResuAI',
    title: 'ResuAI – AI Resume Builder, ATS Checker & Portfolio Generator',
    description:
      'Build a job-winning resume, check ATS compatibility, generate a stunning portfolio, and write personalized cover letters — all powered by AI.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'ResuAI – AI-powered career tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResuAI – AI Resume Builder, ATS Checker & Portfolio Generator',
    description:
      'Build a job-winning resume, generate a stunning portfolio, and write personalized cover letters with AI.',
    images: [`${BASE_URL}/og-image.png`],
    creator: '@resuai',
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ResuAI',
  url: BASE_URL,
  description:
    'AI-powered tools to build job-winning resumes, portfolios, and cover letters.',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${BASE_URL}/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Permissions-Policy" content="clipboard-write=(self)" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter+Tight:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

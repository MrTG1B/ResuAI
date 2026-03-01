import type { Metadata } from 'next';

const BASE_URL = 'https://resuai.web.app';

export const metadata: Metadata = {
  title: 'Pricing – Plans that Plant Trees | ResuAI',
  description:
    'Choose a ResuAI plan and grow your career while growing the planet. Every paid subscription plants a real tree in your name and comes with a personalised certificate. Start free.',
  keywords: [
    'ResuAI pricing',
    'AI resume builder plans',
    'eco-friendly subscription',
    'tree planting career tools',
    'green tech subscription',
    'plant a tree certificate',
    'resume builder pricing',
    'career tools subscription India',
  ],
  alternates: {
    canonical: `${BASE_URL}/pricing`,
  },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/pricing`,
    title: 'Pricing – Plans that Plant Trees | ResuAI',
    description:
      'Every ResuAI paid plan plants a real tree in your name and delivers a personalised certificate. Upgrade your career and the planet.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'ResuAI – Pricing plans that plant trees',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing – Plans that Plant Trees | ResuAI',
    description:
      'Every ResuAI paid plan plants a real tree in your name. Grow your career. Grow the planet.',
    images: [`${BASE_URL}/og-image.png`],
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

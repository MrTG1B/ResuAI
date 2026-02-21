
import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const metadata: Metadata = {
  title: 'FAQ – Frequently Asked Questions | ResuAI',
  description:
    "Find answers to the most common questions about ResuAI — AI resume builder, ATS checker, portfolio generator, cover letter writer, and more.",
  openGraph: {
    title: 'FAQ – Frequently Asked Questions | ResuAI',
    description:
      "Everything you need to know about ResuAI's AI-powered career tools.",
    url: 'https://resuai.web.app/faq',
    type: 'website',
  },
  alternates: { canonical: 'https://resuai.web.app/faq' },
};

const faqs = [
  {
    question: 'What is ResuAI?',
    answer:
      'ResuAI is an AI-powered career platform that helps you build job-winning resumes, generate professional portfolios, create tailored cover letters, check your resume against ATS systems, and practice for interviews — all in one place.',
  },
  {
    question: 'Is ResuAI free to use?',
    answer:
      'ResuAI offers a free tier that includes access to core features such as the AI Resume Editor, ATS Checker, and Portfolio Generator. Premium features with higher usage limits may be introduced in future plans.',
  },
  {
    question: 'How does the AI Resume Editor work?',
    answer:
      'Simply upload your existing resume or paste your experience. Our AI analyzes your content, suggests improvements to phrasing and structure, fixes grammatical errors, and lets you apply professional templates with a single click.',
  },
  {
    question: 'What is an ATS and why does it matter?',
    answer:
      'An Applicant Tracking System (ATS) is software used by recruiters to scan and filter resumes before a human ever reads them. Our AI Resume ATS Checker evaluates your resume against a specific job description and provides a compatibility score with actionable suggestions to improve your chances.',
  },
  {
    question: 'How does the AI Portfolio Generator work?',
    answer:
      'After building or uploading your resume, the Portfolio Generator transforms it into a stunning, publicly shareable portfolio website. Choose from multiple professional themes and share your unique link with recruiters.',
  },
  {
    question: 'Can I use ResuAI for multiple resumes?',
    answer:
      'Yes. You can create and manage multiple resume versions within your account, tailoring each one for different roles or industries.',
  },
  {
    question: 'How secure is my data?',
    answer:
      'Security is a top priority. All data is stored in Google Firebase with strict security rules ensuring only you can access your documents. All connections are encrypted via HTTPS/TLS, and we enforce Content Security Policy and other security headers on every request.',
  },
  {
    question: 'Does ResuAI sell my personal data?',
    answer:
      'No. We do not sell, rent, or share your personal data with third parties for marketing purposes. Please review our Privacy Policy for full details.',
  },
  {
    question: 'What AI models power ResuAI?',
    answer:
      "ResuAI uses Google's Gemini models via the Genkit AI framework to power all AI features including resume analysis, cover letter generation, interview practice, and more.",
  },
  {
    question: 'How do I delete my account?',
    answer:
      'You can request account deletion at any time by contacting us at support@resuai.com. We will delete your account and all associated data within 30 days.',
  },
  {
    question: 'Is there a mobile app?',
    answer:
      'ResuAI is a fully responsive web application and works great on mobile browsers. A dedicated native mobile app is on our roadmap.',
  },
  {
    question: 'How can I contact support?',
    answer:
      'You can reach us via the Feedback page inside the app, or by emailing support@resuai.com. We aim to respond within 1–2 business days.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow">
          {/* Hero */}
          <section className="py-16 lg:py-24 text-center">
            <div className="container mx-auto px-4 max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-heading bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
                Frequently Asked Questions
              </h1>
              <p className="text-lg text-muted-foreground">
                Everything you need to know about ResuAI. Can't find your answer?{' '}
                <a href="mailto:support@resuai.com" className="text-primary hover:underline">
                  Contact us
                </a>
                .
              </p>
            </div>
          </section>

          {/* FAQ Accordion */}
          <section className="pb-20 lg:pb-32">
            <div className="container mx-auto px-4 max-w-3xl">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`faq-${index}`}
                    className="border border-border rounded-lg px-6 bg-card/60 backdrop-blur-sm"
                  >
                    <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary hover:no-underline py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}

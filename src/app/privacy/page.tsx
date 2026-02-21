
import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Privacy Policy | ResuAI',
  description:
    'Read the ResuAI Privacy Policy to understand how we collect, use, and protect your personal information.',
  openGraph: {
    title: 'Privacy Policy | ResuAI',
    description: 'How ResuAI collects, uses, and protects your personal data.',
    url: 'https://resuai.web.app/privacy',
    type: 'website',
  },
  alternates: { canonical: 'https://resuai.web.app/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-heading">
              Privacy Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none prose-p:my-4 prose-h2:font-heading prose-h2:text-2xl prose-h2:text-primary">
            <p>Last updated: February 21, 2025</p>
            <p>
              This Privacy Policy describes how ResuAI (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and
              shares your personal information when you use our website and services at{' '}
              <a href="https://resuai.web.app" className="text-primary">
                resuai.web.app
              </a>{' '}
              (the &quot;Service&quot;).
            </p>

            <h2>1. Information We Collect</h2>
            <p>We collect the following categories of information:</p>
            <ul>
              <li>
                <strong>Account Information:</strong> When you register, we collect your name,
                email address, and profile picture (if you sign in via Google).
              </li>
              <li>
                <strong>Resume & Career Data:</strong> Content you upload or create using our tools,
                including resume text, work history, skills, and portfolio information.
              </li>
              <li>
                <strong>Usage Data:</strong> Pages visited, features used, and interactions with the
                Service, collected automatically via standard server logs and analytics.
              </li>
              <li>
                <strong>Device Information:</strong> IP address, browser type, operating system, and
                referral URLs.
              </li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, operate, and improve the Service.</li>
              <li>Personalize AI-generated content (resumes, cover letters, portfolios).</li>
              <li>Send transactional emails (e.g., account confirmation, password reset).</li>
              <li>Respond to support requests and feedback.</li>
              <li>Monitor for abuse, fraud, and security threats.</li>
              <li>Comply with legal obligations.</li>
            </ul>

            <h2>3. Sharing Your Information</h2>
            <p>
              We do <strong>not</strong> sell or rent your personal data to third parties. We may
              share your information only with:
            </p>
            <ul>
              <li>
                <strong>Service Providers:</strong> Google Firebase (database &amp; authentication),
                Google Cloud (AI processing). These providers are contractually obligated to protect
                your data.
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law, court order, or
                government authority.
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a merger, acquisition, or
                sale of assets, your data may be transferred to the successor entity.
              </li>
            </ul>

            <h2>4. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide the
              Service. You may request deletion of your account and associated data at any time by
              contacting us at{' '}
              <a href="mailto:support@resuai.com" className="text-primary">
                support@resuai.com
              </a>
              . We will fulfill deletion requests within 30 days.
            </p>

            <h2>5. Cookies &amp; Tracking Technologies</h2>
            <p>
              We use essential session cookies required for authentication and site functionality.
              We do not use advertising or tracking cookies. You can configure your browser to
              refuse cookies, but some features of the Service may not function correctly.
            </p>

            <h2>6. Security</h2>
            <p>
              We implement industry-standard security measures including HTTPS/TLS encryption,
              Content Security Policy headers, HTTP Strict Transport Security, and Firebase
              Security Rules to protect your data from unauthorized access. However, no method of
              transmission over the internet is 100% secure.
            </p>

            <h2>7. Children&apos;s Privacy</h2>
            <p>
              The Service is not directed to children under the age of 13. We do not knowingly
              collect personal information from children under 13. If you believe we have
              inadvertently collected such information, please contact us immediately.
            </p>

            <h2>8. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have rights to access, correct, delete, or
              port your personal data. To exercise any of these rights, please contact us at{' '}
              <a href="mailto:support@resuai.com" className="text-primary">
                support@resuai.com
              </a>
              .
            </p>

            <h2>9. Third-Party Links</h2>
            <p>
              The Service may contain links to third-party websites. We are not responsible for the
              privacy practices of those sites and encourage you to review their privacy policies.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes by posting the new policy on this page with an updated date. Continued use of
              the Service after changes constitutes your acceptance of the updated policy.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:support@resuai.com" className="text-primary">
                support@resuai.com
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

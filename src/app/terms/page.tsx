
import type { Metadata } from 'next';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: 'Terms of Service | ResuAI',
  description: 'Read the ResuAI Terms of Service to understand your rights and obligations when using our AI career tools.',
  alternates: { canonical: 'https://resuai.web.app/terms' },
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-heading">
              Terms and Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none prose-p:my-4 prose-h2:font-heading prose-h2:text-2xl prose-h2:text-primary">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p>Please read these terms and conditions carefully before using Our Service.</p>
            
            <h2>Interpretation and Definitions</h2>
            <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
            
            <h2>Acknowledgment</h2>
            <p>These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.</p>
            <p>Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.</p>
            
            <h2>User Accounts</h2>
            <p>When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.</p>
            
            <h2>Content</h2>
            <p>Our Service allows You to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that You post to the Service, including its legality, reliability, and appropriateness.</p>

            <h2>Termination</h2>
            <p>We may terminate or suspend Your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions.</p>
            
            <h2>Changes to These Terms and Conditions</h2>
            <p>We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.</p>
            
            <h2>Contact Us</h2>
            <p>If you have any questions about these Terms and Conditions, You can contact us by email at support@resuai.com.</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

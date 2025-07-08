
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-heading">
              About ResuAI
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none prose-p:my-4 prose-h3:font-heading prose-h3:text-2xl prose-h3:text-primary">
            <p>
              Welcome to ResuAI, your ultimate partner in career advancement. Our mission is to empower professionals like you by providing cutting-edge AI tools that simplify and enhance the job application process.
            </p>
            <p>
              In today's competitive job market, a standout resume and a compelling portfolio are more important than ever. We understand that crafting these materials can be time-consuming and challenging. That's why we built ResuAI—to leverage the power of artificial intelligence and make it easy for you to create documents that get noticed.
            </p>
            <h3>Our Tools</h3>
            <p>
              Our suite of tools is designed to cover every aspect of your application needs:
            </p>
            <ul>
              <li><strong>AI Resume Editor:</strong> Go beyond simple spell-checking. Our AI assistant helps you refine your content, improve your phrasing, and even redesign your entire resume layout with professional templates.</li>
              <li><strong>AI Resume Analyzer:</strong> Get instant, personalized feedback. Our AI coach analyzes your resume against any job description, identifying strengths, weaknesses, and providing actionable steps to optimize your resume for success.</li>
              <li><strong>AI Portfolio Generator:</strong> Transform your resume into a stunning, professional portfolio website in seconds. Showcase your work, skills, and experience with beautiful, customizable themes.</li>
            </ul>
            <h3>Our Vision</h3>
            <p>
              We believe that everyone deserves a chance to land their dream job. By combining sophisticated AI with a user-friendly interface, we aim to level the playing field and give you the confidence to put your best foot forward.
            </p>
            <p>
              Thank you for choosing ResuAI. Let's build your future, together.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

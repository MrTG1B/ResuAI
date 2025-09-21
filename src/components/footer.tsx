
import Link from 'next/link';
import Image from 'next/image';
import { FileText, SearchCheck, LayoutTemplate, NotebookPen, MessageCircleQuestion, BrainCircuit } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <Image src="/logo.png" alt="ResuAI Logo" width={90} height={23} style={{ height: 'auto' }} />
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs">
              AI-powered tools to build job-winning resumes, portfolios, and cover letters.
            </p>
          </div>

          {/* Tools Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Tools</h3>
            <nav className="flex flex-col space-y-2 text-sm">
              <Link href="/resume-builder" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><FileText className="h-4 w-4" /> AI Resume Editor</Link>
              <Link href="/resume-analyzer" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><SearchCheck className="h-4 w-4" /> ATS Resume Checker</Link>
              <Link href="/build" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><LayoutTemplate className="h-4 w-4" /> Portfolio Generator</Link>
              <Link href="/cover-letter-generator" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><NotebookPen className="h-4 w-4" /> Cover Letter Writer</Link>
              <Link href="/interview-prep" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><MessageCircleQuestion className="h-4 w-4" /> Interview Practice</Link>
              <Link href="/aptitude-test" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"><BrainCircuit className="h-4 w-4" /> Aptitude Test</Link>
            </nav>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <nav className="flex flex-col space-y-2 text-sm">
              <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
              <Link href="/feedback" className="text-muted-foreground hover:text-primary transition-colors">Feedback</Link>
              <Link href="/#contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
            </nav>
          </div>

           {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <nav className="flex flex-col space-y-2 text-sm">
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ResuAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


import Link from 'next/link';

export function Footer() {
  return (
    <footer className="py-6 px-4 sm:px-6 lg:px-8 border-t bg-card text-card-foreground">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ResuAI. All rights reserved.</p>
        <nav className="flex gap-4 mt-4 sm:mt-0">
          <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
        </nav>
      </div>
    </footer>
  );
}

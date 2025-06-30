import Link from "next/link";
import { FileText } from "lucide-react";

export function Header() {
  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 border-b">
      <div className="container mx-auto">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
          <FileText className="h-7 w-7" />
          <span>ResuAI</span>
        </Link>
      </div>
    </header>
  );
}

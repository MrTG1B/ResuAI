export function Footer() {
  return (
    <footer className="py-4 px-4 sm:px-6 lg:px-8 border-t">
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ResuAI. All rights reserved.</p>
      </div>
    </footer>
  );
}

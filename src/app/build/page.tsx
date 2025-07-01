import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ResumeForm } from "@/components/resume-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BuildPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-2xl">
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Transform Your Resume into a Portfolio
              </h1>
              <CardDescription className="mt-2 text-lg">
                Upload your resume, and our AI will craft a beautiful, professional portfolio website for you in seconds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResumeForm />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

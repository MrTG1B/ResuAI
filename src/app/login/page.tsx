"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Loader2 } from "lucide-react";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.62-4.88 1.62-3.86 0-6.99-3.14-6.99-7s3.13-7 6.99-7c2.16 0 3.63.89 4.49 1.69l2.6-2.6C16.84 3.3 14.86 2.5 12.48 2.5c-5.48 0-9.98 4.5-9.98 9.98s4.5 9.98 9.98 9.98c5.48 0 9.74-3.88 9.74-9.98 0-.6-.05-1.2-.15-1.78Z" fill="currentColor"/>
    </svg>
  );

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({ title: "Configuration Error", description: "Firebase is not configured.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login Successful",
        description: "Redirecting you to the portfolio builder...",
      });
      router.push("/build");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) {
      toast({ title: "Configuration Error", description: "Firebase is not configured.", variant: "destructive" });
      return;
    }
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        toast({
            title: "Signed In Successfully",
            description: "Redirecting you to the portfolio builder...",
        });
        router.push("/build");
    } catch (error: any) {
        toast({
            title: "Google Sign-In Failed",
            description: "Could not sign in with Google. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Enter your email below to login to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailLogin} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="ml-auto inline-block text-sm underline">
                    Forgot your password?
                  </Link>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
             <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
             <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
                {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
                Sign in with Google
            </Button>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

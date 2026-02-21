"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { GoogleIcon } from "@/components/icons/google-icon";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Admin email from environment variable - must be set in production
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    if (!auth) return;
    if (!ADMIN_EMAIL) return;
    getRedirectResult(auth)
      .then((result) => {
        if (!result?.user) return;
        if (result.user.email !== ADMIN_EMAIL) {
          auth!.signOut();
          toast({
            title: "Access Denied",
            description: "You do not have admin privileges.",
            variant: "destructive",
          });
          return;
        }
        setIsGoogleLoading(true);
        sessionStorage.setItem("admin-auth", "true");
        router.push("/admin");
      })
      .catch((error: any) => {
        console.error("Google sign-in redirect error:", error);
        let errorMessage = "Could not sign in with Google. Please try again.";
        if (error.code === 'auth/unauthorized-domain') {
          errorMessage = "This domain is not authorized for Google sign-in. Contact the administrator.";
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = "Google sign-in is not enabled. Please contact the administrator.";
        } else if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = "An account already exists with the same email address. Please sign in using your email and password.";
        }
        toast({
          title: "Google Sign-In Failed",
          description: errorMessage,
          variant: "destructive",
        });
      });
  }, [router, toast, ADMIN_EMAIL]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!ADMIN_EMAIL) {
      toast({ 
        title: "Configuration Error", 
        description: "Admin email not configured. Set NEXT_PUBLIC_ADMIN_EMAIL in environment.", 
        variant: "destructive" 
      });
      setIsLoading(false);
      return;
    }

    if (!auth) {
      toast({ title: "Configuration Error", description: "Firebase is not configured.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if the user is the admin
      if (userCredential.user.email !== ADMIN_EMAIL) {
        await auth.signOut();
        toast({
          title: "Access Denied",
          description: "You do not have admin privileges.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem("admin-auth", "true");
      router.push("/admin");

    } catch (error: any) {
      let errorMessage = "Invalid credentials. Please try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "The admin account credentials are not correct.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      }
      toast({
        title: "Login Failed",
        description: errorMessage,
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
    
    if (!ADMIN_EMAIL) {
      toast({ 
        title: "Configuration Error", 
        description: "Admin email not configured. Set NEXT_PUBLIC_ADMIN_EMAIL in environment.", 
        variant: "destructive" 
      });
      return;
    }
    
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Google Sign-In Failed",
        description: "Could not initiate Google sign-in. Please try again.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="absolute top-8">
        <Image src="/logo.png" alt="ResuAI Logo" width={140} height={35} style={{ height: 'auto' }} />
      </div>
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-heading">Admin Login</CardTitle>
          <CardDescription>
            Enter your admin credentials to access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@resuai.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Hardcoded admin UID. In a real app, use custom claims.
  const ADMIN_UID = "YOUR_ADMIN_UID_HERE";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (email.toLowerCase() !== "tirthankdasgupta2004@gmail.com" || password !== "admin") {
         toast({
            title: "Access Denied",
            description: "You are not authorized to access the admin panel.",
            variant: "destructive",
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
        // We sign in the user to get an auth token, but rely on the hardcoded check for authorization.
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // In a more secure setup, we would check a custom claim from the user's token here.
        // For this demo, we assume the login credentials are the authorization method.
        sessionStorage.setItem("admin-auth", "true");
        toast({
            title: "Login Successful",
            description: "Redirecting to the admin dashboard...",
        });
        router.push("/admin/dashboard");

    } catch (error: any) {
        let errorMessage = "Invalid credentials. Please try again.";
        if(error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = "The admin account credentials are not correct.";
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

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4">
        <div className="absolute top-8">
            <Logo className="h-10 w-auto"/>
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
                placeholder="admin@example.com"
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
                placeholder="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

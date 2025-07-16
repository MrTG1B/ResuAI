'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { submitFeedbackAction } from '@/app/actions';
import { Loader2 } from 'lucide-react';

const feedbackSchema = z.object({
  feedback: z.string().min(10, { message: 'Feedback must be at least 10 characters.' }).max(5000, { message: 'Feedback cannot exceed 5000 characters.' }),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

export default function FeedbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedback: '',
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const onSubmit = async (data: FeedbackFormData) => {
    if (!currentUser) {
      toast({ title: 'Not authenticated', description: 'You must be logged in to submit feedback.', variant: 'destructive' });
      return;
    }

    const result = await submitFeedbackAction({
      feedback: data.feedback,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      userName: currentUser.displayName,
    });

    if (result.success) {
      toast({ title: 'Feedback Submitted!', description: "Thank you for helping us improve ResuAI." });
      form.reset();
      router.push('/dashboard');
    } else {
      toast({ title: 'Submission Failed', description: result.error, variant: 'destructive' });
    }
  };

  if (isLoading || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight font-heading">Submit Feedback</CardTitle>
            <CardDescription>We'd love to hear your thoughts, suggestions, or bug reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="feedback"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="feedback" className="sr-only">Your Feedback</Label>
                      <FormControl>
                        <Textarea
                          id="feedback"
                          placeholder="Tell us what you think..."
                          className="h-40 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Feedback
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

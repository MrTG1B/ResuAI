
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, doc, getDoc } from '@/lib/firebase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { generateCoverLetterAction } from '@/app/actions';
import { type PersonalInfo } from '@/types/portfolio';
import { Loader2, Sparkles, Clipboard, RefreshCw } from 'lucide-react';
import { CreativeLoader } from '@/components/creative-loader';

const coverLetterSchema = z.object({
  jobDescription: z.string().min(50, { message: 'Please provide a more detailed job description.' }),
  companyName: z.string().min(1, { message: 'Company name is required.' }),
  hiringManager: z.string().optional(),
  tone: z.enum(['Professional', 'Enthusiastic', 'Formal', 'Creative']).default('Professional'),
});

type CoverLetterFormData = z.infer<typeof coverLetterSchema>;

const generatingTexts = [
  "Drafting your introduction...",
  "Aligning your skills with the job...",
  "Highlighting your key experiences...",
  "Crafting a powerful closing...",
  "Putting on the final touches...",
];

export default function CoverLetterGeneratorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Partial<PersonalInfo> | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');

  const form = useForm<CoverLetterFormData>({
    resolver: zodResolver(coverLetterSchema),
    defaultValues: {
      jobDescription: '',
      companyName: '',
      hiringManager: '',
      tone: 'Professional',
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const profileDocRef = doc(db, 'users', user.uid, 'profile', 'data');
        const docSnap = await getDoc(profileDocRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as PersonalInfo);
        } else {
          toast({
            title: 'Profile Not Found',
            description: 'Please complete your profile first for the best results.',
            variant: 'destructive',
          });
          router.push('/profile');
        }
      } else {
        router.push('/login');
      }
      setIsPageLoading(false);
    });
    return () => unsubscribe();
  }, [router, toast]);

  const onSubmit = async (data: CoverLetterFormData) => {
    if (!currentUser || !userProfile) {
      toast({ title: 'Error', description: 'User profile is not available.', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    setGeneratedLetter('');

    try {
      const result = await generateCoverLetterAction({
        ...data,
        userProfile: userProfile as PersonalInfo,
      });

      if (result.success && result.data) {
        setGeneratedLetter(result.data.coverLetter);
      } else {
        throw new Error(result.error || 'Failed to generate cover letter.');
      }
    } catch (error: any) {
      toast({ title: 'Generation Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLetter);
    toast({ title: 'Copied!', description: 'Cover letter copied to clipboard.' });
  };
  
  const handleRefine = () => {
    // This is a placeholder for a future refinement feature
    toast({ title: 'Refine Clicked', description: 'Refinement feature coming soon!' });
  }

  if (isPageLoading || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Column */}
          <Card className="shadow-2xl">
            <CardHeader>
              <CardTitle className="text-3xl font-bold tracking-tight font-heading">AI Cover Letter Generator</CardTitle>
              <CardDescription>Fill in the details below, and our AI will write a tailored cover letter for you based on your profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="companyName">Company Name</Label>
                        <FormControl>
                          <Input id="companyName" placeholder="e.g., Acme Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hiringManager"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="hiringManager">Hiring Manager (Optional)</Label>
                        <FormControl>
                          <Input id="hiringManager" placeholder="e.g., Jane Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tone"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Tone</Label>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a tone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Professional">Professional</SelectItem>
                            <SelectItem value="Enthusiastic">Enthusiastic</SelectItem>
                            <SelectItem value="Formal">Formal</SelectItem>
                            <SelectItem value="Creative">Creative</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="jobDescription"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="jobDescription">Job Description</Label>
                        <FormControl>
                          <Textarea
                            id="jobDescription"
                            placeholder="Paste the full job description here..."
                            className="h-40 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full text-lg" size="lg" disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                    Generate Cover Letter
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Result Column */}
          <Card className="shadow-2xl flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl font-bold tracking-tight font-heading">Your Generated Cover Letter</CardTitle>
              <CardDescription>Review the generated letter below. You can copy it or refine it further.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
                <div className="flex-grow rounded-md border bg-muted/50 p-4 prose prose-sm prose-invert max-w-none prose-p:my-2 overflow-y-auto min-h-[400px]">
                    {isGenerating ? (
                        <div className="flex items-center justify-center h-full">
                           <CreativeLoader texts={generatingTexts} />
                        </div>
                    ) : generatedLetter ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                            {generatedLetter}
                        </ReactMarkdown>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Your cover letter will appear here...
                        </div>
                    )}
                </div>
            </CardContent>
            {generatedLetter && (
                <div className="p-6 pt-0 flex gap-2 justify-end">
                    <Button variant="outline" onClick={handleCopy}>
                        <Clipboard className="mr-2 h-4 w-4" /> Copy
                    </Button>
                </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

    
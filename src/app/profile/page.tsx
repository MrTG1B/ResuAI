
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db, doc, getDoc, setDoc } from "@/lib/firebase";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, PlusCircle, UserCircle } from "lucide-react";

const socialLinkSchema = z.object({
  platform: z.string().min(1, "Platform name is required"),
  url: z.string().url("Please enter a valid URL"),
});

const profileSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL").optional(),
  location: z.string().optional(),
  socials: z.array(socialLinkSchema).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      socials: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "socials",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const profileDocRef = doc(db, 'users', user.uid, 'profile', 'data');
        const docSnap = await getDoc(profileDocRef);
        if (docSnap.exists()) {
          reset(docSnap.data() as ProfileFormData);
        }
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const profileDocRef = doc(db, 'users', currentUser.uid, 'profile', 'data');
      await setDoc(profileDocRef, data, { merge: true });
      toast({
        title: "Profile Updated",
        description: "Your information has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <UserCircle className="h-10 w-10 text-primary"/>
              <div>
                <CardTitle className="text-3xl font-bold tracking-tight font-heading">
                  Your Profile
                </CardTitle>
                <CardDescription>
                  This information will be used to auto-fill your resumes and portfolios.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" {...register("name")} placeholder="e.g., Jane Doe" />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Professional Title</Label>
                  <Input id="title" {...register("title")} placeholder="e.g., Software Engineer" />
                  {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" {...register("email")} placeholder="e.g., jane.doe@example.com" />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" {...register("phone")} placeholder="e.g., (123) 456-7890" />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website/Portfolio</Label>
                  <Input id="website" {...register("website")} placeholder="e.g., https://your-portfolio.com" />
                  {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" {...register("location")} placeholder="e.g., San Francisco, CA" />
                  {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Social Links</Label>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2">
                    <div className="grid gap-1.5 flex-grow">
                      <Label htmlFor={`socials.${index}.platform`} className="text-xs">Platform</Label>
                      <Input
                        id={`socials.${index}.platform`}
                        {...register(`socials.${index}.platform`)}
                        placeholder="e.g., LinkedIn"
                        className="bg-muted"
                      />
                      {errors.socials?.[index]?.platform && <p className="text-sm text-destructive">{errors.socials?.[index]?.platform?.message}</p>}
                    </div>
                    <div className="grid gap-1.5 flex-grow">
                      <Label htmlFor={`socials.${index}.url`} className="text-xs">URL</Label>
                      <Input
                        id={`socials.${index}.url`}
                        {...register(`socials.${index}.url`)}
                        placeholder="https://linkedin.com/in/..."
                        className="bg-muted"
                      />
                       {errors.socials?.[index]?.url && <p className="text-sm text-destructive">{errors.socials?.[index]?.url?.message}</p>}
                    </div>
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => append({ platform: "", url: "" })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Social Link
                </Button>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

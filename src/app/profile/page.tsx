
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
import { Loader2, Trash2, PlusCircle, UserCircle, Briefcase, GraduationCap, Lightbulb, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const socialLinkSchema = z.object({
  platform: z.string().min(1, "Platform name is required"),
  url: z.string().url("Please enter a valid URL"),
});

const experienceSchema = z.object({
  role: z.string().min(1, "Role is required"),
  company: z.string().min(1, "Company is required"),
  location: z.string().optional(),
  dates: z.string().min(1, "Dates are required"),
  description: z.string().optional(),
});

const educationSchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  school: z.string().min(1, "School is required"),
  location: z.string().optional(),
  dates: z.string().min(1, "Dates are required"),
});

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  technologies: z.string().optional(),
  url: z.string().url("Please enter a valid URL").optional(),
});

const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuingOrganization: z.string().optional(),
  date: z.string().optional(),
  credentialUrl: z.string().url("Please enter a valid URL").optional(),
  // We'll store the file as a data URI string in Firestore
  certificateDataUri: z.string().optional(), 
});

const profileSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL").optional(),
  location: z.string().optional(),
  socials: z.array(socialLinkSchema).optional(),
  experience: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  projects: z.array(projectSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const SectionTitle = ({ icon, text }: { icon: React.ElementType, text: string }) => {
  const Icon = icon;
  return (
    <h3 className="text-xl font-semibold flex items-center gap-2 mb-4 text-primary font-heading">
      <Icon className="h-5 w-5" />
      {text}
    </h3>
  )
};

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
      experience: [],
      education: [],
      projects: [],
      certifications: [],
    },
  });

  const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({ control, name: "socials" });
  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: "experience" });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: "education" });
  const { fields: projFields, append: appendProj, remove: removeProj } = useFieldArray({ control, name: "projects" });
  const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({ control, name: "certifications" });

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

  const handleCertificateUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "File too large", description: "Please select a file smaller than 2MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        const updatedCerts = [...certFields];
        updatedCerts[index] = { ...updatedCerts[index], certificateDataUri: dataUri };
        
        // This is a bit of a hack to update the field in react-hook-form
        // A better approach might involve setValue from useForm, but this works for now.
        const currentData = control._getWatch("certifications") || [];
        currentData[index].certificateDataUri = dataUri;
        control._formValues.certifications = currentData;
        
        // Re-render the component to show the change
        appendCert({ name: "" }, { shouldFocus: false });
        removeCert(certFields.length);
        toast({title: "Certificate Uploaded", description: `${file.name} is ready to be saved.`});
      };
      reader.readAsDataURL(file);
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
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <UserCircle className="h-10 w-10 text-primary"/>
              <div>
                <CardTitle className="text-3xl font-bold tracking-tight font-heading">
                  Your Professional Profile
                </CardTitle>
                <CardDescription>
                  This information will be used to auto-fill your resumes and portfolios. Keep it up-to-date!
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="certifications">Certs</TabsTrigger>
                </TabsList>
                
                {/* Personal Info Tab */}
                <TabsContent value="personal" className="space-y-6 pt-4">
                   <SectionTitle icon={UserCircle} text="Personal Information" />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" {...register("name")} placeholder="e.g., Jane Doe" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="title">Professional Title</Label>
                          <Input id="title" {...register("title")} placeholder="e.g., Software Engineer" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input id="email" type="email" {...register("email")} placeholder="e.g., jane.doe@example.com" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" {...register("phone")} placeholder="e.g., (123) 456-7890" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">Website/Portfolio</Label>
                          <Input id="website" {...register("website")} placeholder="e.g., https://your-portfolio.com" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input id="location" {...register("location")} placeholder="e.g., San Francisco, CA" />
                        </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-center gap-4">
                          <Label className="text-lg font-semibold">Social Links</Label>
                          <Button type="button" variant="outline" size="sm" onClick={() => appendSocial({ platform: "", url: "" })}>
                              <PlusCircle className="mr-2 h-4 w-4" /> Add
                          </Button>
                      </div>
                      {socialFields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2 p-3 rounded-md border bg-muted/50">
                          <div className="grid gap-1.5 flex-grow">
                            <Label htmlFor={`socials.${index}.platform`} className="text-xs">Platform</Label>
                            <Input {...register(`socials.${index}.platform`)} placeholder="e.g., LinkedIn" />
                          </div>
                          <div className="grid gap-1.5 flex-grow">
                            <Label htmlFor={`socials.${index}.url`} className="text-xs">URL</Label>
                            <Input {...register(`socials.${index}.url`)} placeholder="https://linkedin.com/in/..." />
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeSocial(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                </TabsContent>

                {/* Experience Tab */}
                <TabsContent value="experience" className="space-y-6 pt-4">
                  <div className="flex items-center justify-between">
                    <SectionTitle icon={Briefcase} text="Work Experience" />
                    <Button type="button" variant="outline" size="sm" onClick={() => appendExp({ role: "", company: "", dates: "", location: "", description: "" })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
                    </Button>
                  </div>
                  {expFields.map((field, index) => (
                    <div key={field.id} className="space-y-3 p-4 rounded-md border bg-muted/50 relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input {...register(`experience.${index}.role`)} placeholder="Role / Title" />
                          <Input {...register(`experience.${index}.company`)} placeholder="Company Name" />
                          <Input {...register(`experience.${index}.location`)} placeholder="Location" />
                          <Input {...register(`experience.${index}.dates`)} placeholder="Dates (e.g., Jan 2020 - Present)" />
                        </div>
                        <Textarea {...register(`experience.${index}.description`)} placeholder="Key responsibilities and achievements..." />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeExp(index)} className="absolute top-2 right-2">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                  ))}
                </TabsContent>

                {/* Education Tab */}
                <TabsContent value="education" className="space-y-6 pt-4">
                   <div className="flex items-center justify-between">
                      <SectionTitle icon={GraduationCap} text="Education" />
                      <Button type="button" variant="outline" size="sm" onClick={() => appendEdu({ degree: "", school: "", dates: "", location: "" })}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Education
                      </Button>
                    </div>
                    {eduFields.map((field, index) => (
                      <div key={field.id} className="space-y-3 p-4 rounded-md border bg-muted/50 relative">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input {...register(`education.${index}.degree`)} placeholder="Degree (e.g., B.S. in Computer Science)" />
                            <Input {...register(`education.${index}.school`)} placeholder="School Name" />
                            <Input {...register(`education.${index}.location`)} placeholder="Location" />
                            <Input {...register(`education.${index}.dates`)} placeholder="Dates (e.g., Aug 2016 - May 2020)" />
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeEdu(index)} className="absolute top-2 right-2">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                      </div>
                    ))}
                </TabsContent>

                 {/* Projects Tab */}
                <TabsContent value="projects" className="space-y-6 pt-4">
                    <div className="flex items-center justify-between">
                        <SectionTitle icon={Lightbulb} text="Projects" />
                        <Button type="button" variant="outline" size="sm" onClick={() => appendProj({ name: "", description: "", technologies: "", url: "" })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Project
                        </Button>
                    </div>
                    {projFields.map((field, index) => (
                        <div key={field.id} className="space-y-3 p-4 rounded-md border bg-muted/50 relative">
                            <Input {...register(`projects.${index}.name`)} placeholder="Project Name" />
                            <Textarea {...register(`projects.${index}.description`)} placeholder="Project description..." />
                            <Input {...register(`projects.${index}.technologies`)} placeholder="Technologies used (comma-separated)" />
                            <Input {...register(`projects.${index}.url`)} placeholder="Project URL" />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeProj(index)} className="absolute top-2 right-2">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </TabsContent>

                 {/* Certifications Tab */}
                <TabsContent value="certifications" className="space-y-6 pt-4">
                    <div className="flex items-center justify-between">
                        <SectionTitle icon={Award} text="Licenses & Certifications" />
                        <Button type="button" variant="outline" size="sm" onClick={() => appendCert({ name: "", issuingOrganization: "", date: "", credentialUrl: "" })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Certification
                        </Button>
                    </div>
                    {certFields.map((field, index) => (
                        <div key={field.id} className="space-y-3 p-4 rounded-md border bg-muted/50 relative">
                            <Input {...register(`certifications.${index}.name`)} placeholder="Certification Name" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input {...register(`certifications.${index}.issuingOrganization`)} placeholder="Issuing Organization" />
                                <Input {...register(`certifications.${index}.date`)} placeholder="Issue Date" />
                            </div>
                            <Input {...register(`certifications.${index}.credentialUrl`)} placeholder="Credential URL" />
                            <div>
                               <Label htmlFor={`cert-upload-${index}`} className="text-xs">Upload Certificate (PDF, JPG, PNG)</Label>
                               <Input 
                                 id={`cert-upload-${index}`} 
                                 type="file" 
                                 accept=".pdf,.jpg,.jpeg,.png"
                                 onChange={(e) => handleCertificateUpload(index, e)}
                                 className="text-xs"
                               />
                               {field.certificateDataUri && <p className="text-xs text-green-500 mt-1">Certificate file attached.</p>}
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeCert(index)} className="absolute top-2 right-2">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Profile
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

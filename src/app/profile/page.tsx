
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db, doc, getDoc, setDoc } from "@/lib/firebase";
import { analyzeCertificateAction, uploadImageAction, deleteImageAction, refineSummaryAction } from "@/app/actions";
import Image from "next/image";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, PlusCircle, UserCircle, Briefcase, GraduationCap, Lightbulb, Award, Camera, Sparkles, Wrench, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CountryCodeSelector } from "@/components/country-code-selector";
import { countries } from "@/lib/countries";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


const socialLinkSchema = z.object({
  platform: z.string().min(1, "Platform name is required"),
  url: z.string().url("Please enter a valid URL"),
});

const experienceSchema = z.object({
  role: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  dates: z.string().optional(),
  description: z.string().optional(),
});

const educationSchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  school: z.string().min(1, "School is required"),
  location: z.string().optional(),
  dates: z.string().optional(),
});

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  technologies: z.string().optional(),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
});

const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuingOrganization: z.string().min(1, "Organization is required"),
  date: z.string().optional(),
  credentialUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
});

const profileSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  dob: z.string().optional(),
  profilePictureUrl: z.string().url().optional().or(z.literal('')),
  profilePictureDeleteUrl: z.string().url().optional().or(z.literal('')),
  socials: z.array(socialLinkSchema).optional(),
  skills: z.array(z.string()).optional(),
  experience: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  projects: z.array(projectSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

type EditableSection = 'education' | 'projects' | 'certifications';

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
  const [isUploading, setIsUploading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [isAnalyzingCert, setIsAnalyzingCert] = useState(false);

  // State for managing which dialog is open and for what purpose (add/edit)
  const [editingSection, setEditingSection] = useState<EditableSection | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dialogData, setDialogData] = useState<any>({});


  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const { register, handleSubmit, control, reset, setValue, watch, getValues, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      socials: [],
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      phone: "+91",
      profilePictureUrl: ""
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
          const data = docSnap.data();
          if (!data.phone) {
            data.phone = "+91"; // Default country code if none is saved
          }
          reset(data as ProfileFormData);
        } else {
          // Pre-fill from auth if profile is new, including Google photo
          reset({
            name: user.displayName || '',
            email: user.email || '',
            phone: "+91",
            profilePictureUrl: user.photoURL || '',
          });
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
  
  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'Image Too Large', description: `Please select an image smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB.`, variant: 'destructive' });
        return;
    }
    
    const oldDeleteUrl = getValues('profilePictureDeleteUrl');
    setIsUploading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const dataUri = reader.result as string;
      setLocalImagePreview(dataUri); // Show local preview immediately
      window.dispatchEvent(new CustomEvent('profilePictureUpdated', { detail: { newUrl: dataUri } }));

      try {
        const result = await uploadImageAction(dataUri);

        if (result.success && result.data) {
          setValue('profilePictureUrl', result.data.url, { shouldDirty: true });
          setValue('profilePictureDeleteUrl', result.data.deleteUrl, { shouldDirty: true });
          setLocalImagePreview(null); // Clear local preview, use permanent URL now
          window.dispatchEvent(new CustomEvent('profilePictureUpdated', { detail: { newUrl: result.data.url } })); // Update header with permanent URL
          
          toast({ title: 'Image Uploaded', description: 'Your new profile picture is saved. Remember to save your profile.' });

          if (oldDeleteUrl) {
            await deleteImageAction(oldDeleteUrl);
          }
        } else {
          throw new Error(result.error || "Image upload failed silently.");
        }
      } catch (error: any) {
        toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
        setLocalImagePreview(null); // Revert preview on failure
        window.dispatchEvent(new CustomEvent('profilePictureUpdated', { detail: { newUrl: getValues('profilePictureUrl') } })); // Revert header
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
        toast({ title: 'File Read Error', description: 'There was an error reading the file.', variant: 'destructive' });
        setIsUploading(false);
    }
  };


  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({ title: "File too large", description: "Please select a file smaller than 2MB.", variant: "destructive" });
      return;
    }

    setIsAnalyzingCert(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const certificateDataUri = reader.result as string;
        const result = await analyzeCertificateAction({ certificateDataUri });

        if (result.success && result.data) {
            setDialogData((prev: any) => ({
              ...prev,
              ...result.data
            }));
            toast({ title: "Certificate Analyzed", description: "Details have been auto-filled." });
        } else {
            throw new Error(result.error || "Failed to analyze certificate.");
        }
      } catch (error: any) {
         toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
      } finally {
        setIsAnalyzingCert(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.onerror = () => {
        toast({ title: "File Read Error", description: "There was an error reading the file.", variant: "destructive" });
        setIsAnalyzingCert(false);
    }
  };

  const handleRefineSummary = async () => {
    const currentSummary = getValues('summary');
    if (!currentSummary || currentSummary.trim().length < 10) {
        toast({ title: "Summary Too Short", description: "Please write a summary of at least 10 characters before refining.", variant: "destructive" });
        return;
    }
    setIsRefining(true);
    try {
        const result = await refineSummaryAction({ summary: currentSummary });
        if (result.success && result.data) {
            setValue('summary', result.data.refinedSummary, { shouldDirty: true });
            toast({ title: "Summary Refined", description: "The AI has improved your summary." });
        } else {
            throw new Error(result.error || "Failed to get refined summary from AI.");
        }
    } catch (error: any) {
        toast({ title: "Refinement Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsRefining(false);
    }
  };

  const openDialog = (section: EditableSection, index: number | null = null) => {
    setEditingSection(section);
    setEditingIndex(index);
    if (index !== null) {
      const currentData = getValues(section);
      if (currentData && currentData[index]) {
        setDialogData(currentData[index]);
      }
    } else {
      setDialogData({}); // Clear for new entry
    }
  };

  const closeDialog = () => {
    setEditingSection(null);
    setEditingIndex(null);
    setDialogData({});
  };

  const handleDialogSave = () => {
    if (!editingSection) return;

    if (editingIndex !== null) {
      // Update existing item
      setValue(`${editingSection}.${editingIndex}`, dialogData, { shouldDirty: true });
    } else {
      // Add new item
      switch (editingSection) {
        case 'education': appendEdu(dialogData); break;
        case 'projects': appendProj(dialogData); break;
        case 'certifications': appendCert(dialogData); break;
      }
    }
    closeDialog();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }
  
  const phoneValue = watch('phone') || '';
  const countryCodeMatch = countries.find(c => phoneValue.startsWith(c.dial_code));
  const countryCode = countryCodeMatch ? countryCodeMatch.dial_code : '+91';
  let nationalNumber = phoneValue.startsWith(countryCode) ? phoneValue.substring(countryCode.length) : phoneValue;
  nationalNumber = nationalNumber.replace(/\s/g, '');
  if (nationalNumber.length > 5) {
      nationalNumber = `${nationalNumber.slice(0, 5)} ${nationalNumber.slice(5, 10)}`;
  }

  const profilePictureUrl = watch('profilePictureUrl');
  const displayImageUrl = localImagePreview || profilePictureUrl;
  const watchedEducation = watch('education');
  const watchedProjects = watch('projects');
  const watchedCerts = watch('certifications');

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
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="certifications">Certs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal" className="space-y-6 pt-4">
                   <SectionTitle icon={UserCircle} text="Personal Information" />
                   <div className="flex flex-col md:flex-row items-start gap-6">
                        <div className="space-y-2 flex-shrink-0 text-center">
                            <Label>Profile Picture</Label>
                            <div className="relative w-32 h-32 group mx-auto">
                                <Image
                                    unoptimized
                                    key={displayImageUrl} 
                                    src={displayImageUrl || `https://placehold.co/128x128.png`}
                                    alt="Profile Picture"
                                    width={128}
                                    height={128}
                                    className="rounded-full object-cover w-32 h-32 border-2 border-primary"
                                />
                                <label htmlFor="profile-picture-upload" className="absolute inset-0 bg-black/60 flex items-center justify-center text-white rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8"/>}
                                </label>
                                <Input id="profile-picture-upload" type="file" className="hidden" accept="image/*" onChange={handleProfilePictureUpload} disabled={isUploading} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 max-w-xs">This picture will be used in your resume and portfolio.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
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
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input id="dob" {...register("dob")} placeholder="DD/MM/YYYY" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="flex items-center">
                                    <Controller
                                        control={control}
                                        name="phone"
                                        render={({ field }) => (
                                            <CountryCodeSelector
                                                value={countryCode}
                                                onValueChange={(newCode) => {
                                                  const currentNational = (field.value || '').substring(countryCode.length);
                                                  field.onChange(newCode + currentNational.replace(/\s/g, ''));
                                                }}
                                            />
                                        )}
                                    />
                                    <Input 
                                        id="phone" 
                                        type="tel" 
                                        value={nationalNumber}
                                        onChange={(e) => {
                                            setValue('phone', countryCode + e.target.value.replace(/\s/g, ''))
                                        }}
                                        placeholder="e.g., 12345 67890" 
                                        className="rounded-l-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input id="location" {...register("location")} placeholder="e.g., San Francisco, CA" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="summary">About Me / Professional Summary</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={handleRefineSummary} disabled={isRefining}>
                                        {isRefining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                        Refine with AI
                                    </Button>
                                </div>
                                <Textarea id="summary" {...register("summary")} placeholder="Write a short summary about yourself..." rows={4} />
                            </div>
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
                        <div key={field.id} className="flex items-start gap-4 p-3 rounded-md border bg-muted/50">
                          <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="grid gap-1.5">
                                <Label htmlFor={`socials.${index}.platform`} className="text-xs">Platform</Label>
                                <Input {...register(`socials.${index}.platform`)} placeholder="e.g., LinkedIn" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor={`socials.${index}.url`} className="text-xs">URL</Label>
                                <Input {...register(`socials.${index}.url`)} placeholder="https://linkedin.com/in/..." />
                            </div>
                          </div>
                          <div className="pt-6">
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSocial(index)} className="shrink-0">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                </TabsContent>

                <TabsContent value="skills" className="space-y-6 pt-4">
                    <SectionTitle icon={Wrench} text="Skills" />
                    <div className="p-4 rounded-md border bg-muted/50">
                        <Label htmlFor="skills" className="mb-2 block">Your Skills</Label>
                        <Controller
                            name="skills"
                            control={control}
                            render={({ field }) => (
                                <Textarea
                                    id="skills"
                                    placeholder="Enter your skills, separated by commas (e.g., JavaScript, React, Node.js)"
                                    value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                                    onChange={(e) => {
                                        const skillsArray = e.target.value.split(',').map(skill => skill.trim()).filter(Boolean);
                                        field.onChange(skillsArray);
                                    }}
                                    rows={6}
                                />
                            )}
                        />
                        <p className="text-xs text-muted-foreground mt-2">Separate each skill with a comma. This will help the AI build better resumes for you.</p>
                    </div>
                </TabsContent>

                <TabsContent value="experience" className="space-y-6 pt-4">
                  <div className="flex items-center justify-between">
                    <SectionTitle icon={Briefcase} text="Work Experience" />
                    <Button type="button" variant="outline" size="sm" onClick={() => appendExp({ role: "", company: "", dates: "", location: "", description: "" })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
                    </Button>
                  </div>
                  {expFields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2 p-3 rounded-md border bg-muted/50">
                        <div className="flex-grow space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Input {...register(`experience.${index}.role`)} placeholder="Role / Title" />
                              <Input {...register(`experience.${index}.company`)} placeholder="Company Name" />
                              <Input {...register(`experience.${index}.location`)} placeholder="Location" />
                              <Input {...register(`experience.${index}.dates`)} placeholder="Dates (e.g., Jan 2020 - Present)" />
                            </div>
                            <Textarea {...register(`experience.${index}.description`)} placeholder="Key responsibilities and achievements..." />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeExp(index)} className="shrink-0">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                  ))}
                </TabsContent>

                 <TabsContent value="education" className="space-y-6 pt-4">
                  <div className="flex items-center justify-between">
                    <SectionTitle icon={GraduationCap} text="Education" />
                    <Button type="button" variant="outline" size="sm" onClick={() => openDialog('education')}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Education
                    </Button>
                  </div>
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Degree</TableHead>
                          <TableHead>School</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {watchedEducation?.map((edu, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{edu.degree}</TableCell>
                            <TableCell>{edu.school}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => openDialog('education', index)}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => removeEdu(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent>

                <TabsContent value="projects" className="space-y-6 pt-4">
                  <div className="flex items-center justify-between">
                    <SectionTitle icon={Lightbulb} text="Projects" />
                    <Button type="button" variant="outline" size="sm" onClick={() => openDialog('projects')}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Project
                    </Button>
                  </div>
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project Name</TableHead>
                          <TableHead>Description</TableHead>
                           <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {watchedProjects?.map((proj, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{proj.name}</TableCell>
                            <TableCell className="text-muted-foreground truncate max-w-xs">{proj.description}</TableCell>
                            <TableCell className="text-right">
                               <Button variant="ghost" size="icon" onClick={() => openDialog('projects', index)}><Edit className="h-4 w-4" /></Button>
                               <Button variant="ghost" size="icon" onClick={() => removeProj(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent>

                <TabsContent value="certifications" className="space-y-6 pt-4">
                   <div className="flex items-center justify-between">
                    <SectionTitle icon={Award} text="Licenses & Certifications" />
                    <Button type="button" variant="outline" size="sm" onClick={() => openDialog('certifications')}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Certificate
                    </Button>
                  </div>
                  <Card>
                    <Table>
                       <TableHeader>
                        <TableRow>
                          <TableHead>Certificate Name</TableHead>
                          <TableHead>Issuing Organization</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {watchedCerts?.map((cert, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{cert.name}</TableCell>
                            <TableCell>{cert.issuingOrganization}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => openDialog('certifications', index)}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => removeCert(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent>

              </Tabs>
              
              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={isSaving || isAnalyzingCert || isUploading || isRefining}>
                  {(isSaving || isUploading || isRefining) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />

      {/* DIALOG FOR EDITING/ADDING */}
      <Dialog open={!!editingSection} onOpenChange={(isOpen) => !isOpen && closeDialog()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Edit' : 'Add'} {editingSection?.replace('_', ' ')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingSection === 'education' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="degree" className="text-right">Degree</Label>
                  <Input id="degree" value={dialogData.degree || ''} onChange={(e) => setDialogData({ ...dialogData, degree: e.target.value })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="school" className="text-right">School</Label>
                  <Input id="school" value={dialogData.school || ''} onChange={(e) => setDialogData({ ...dialogData, school: e.target.value })} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">Location</Label>
                  <Input id="location" value={dialogData.location || ''} onChange={(e) => setDialogData({ ...dialogData, location: e.target.value })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dates" className="text-right">Dates</Label>
                  <Input id="dates" value={dialogData.dates || ''} onChange={(e) => setDialogData({ ...dialogData, dates: e.target.value })} className="col-span-3" />
                </div>
              </>
            )}
             {editingSection === 'projects' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" value={dialogData.name || ''} onChange={(e) => setDialogData({ ...dialogData, name: e.target.value })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Textarea id="description" value={dialogData.description || ''} onChange={(e) => setDialogData({ ...dialogData, description: e.target.value })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="technologies" className="text-right">Technologies</Label>
                  <Input id="technologies" value={dialogData.technologies || ''} onChange={(e) => setDialogData({ ...dialogData, technologies: e.target.value })} className="col-span-3" placeholder="Comma-separated"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="url" className="text-right">URL</Label>
                  <Input id="url" value={dialogData.url || ''} onChange={(e) => setDialogData({ ...dialogData, url: e.target.value })} className="col-span-3" />
                </div>
              </>
            )}
             {editingSection === 'certifications' && (
              <>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cert-name" className="text-right">Name</Label>
                  <Input id="cert-name" value={dialogData.name || ''} onChange={(e) => setDialogData({ ...dialogData, name: e.target.value })} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="issuingOrganization" className="text-right">Organization</Label>
                  <Input id="issuingOrganization" value={dialogData.issuingOrganization || ''} onChange={(e) => setDialogData({ ...dialogData, issuingOrganization: e.target.value })} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Date</Label>
                  <Input id="date" value={dialogData.date || ''} onChange={(e) => setDialogData({ ...dialogData, date: e.target.value })} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="credentialUrl" className="text-right">URL</Label>
                  <Input id="credentialUrl" value={dialogData.credentialUrl || ''} onChange={(e) => setDialogData({ ...dialogData, credentialUrl: e.target.value })} className="col-span-3" />
                </div>
                <div className="col-span-4 space-y-2 pt-2 border-t">
                  <Label htmlFor="cert-upload" className="text-sm font-medium">Auto-fill from Certificate</Label>
                   <div className="flex items-center gap-2">
                    <Input 
                     id="cert-upload" 
                     type="file" 
                     onChange={handleCertificateUpload}
                     className="text-xs flex-grow"
                     disabled={isAnalyzingCert}
                    />
                    {isAnalyzingCert && <Loader2 className="h-4 w-4 animate-spin" />}
                   </div>
                   <p className="text-xs text-muted-foreground mt-1">Upload a certificate file to have the AI fill in the details automatically.</p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleDialogSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

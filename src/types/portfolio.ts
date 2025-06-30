export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  title: string;
  profilePictureDataUri?: string;
}

export interface Experience {
  role: string;
  company: string;
  location: string;
  dates: string;
  description: string[];
}

export interface Education {
  degree: string;
  school: string;
  location: string;
  dates: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url: string;
}

export interface Certification {
  name: string;
  issuingOrganization: string;
  date: string;
  credentialUrl?: string;
}

export interface PortfolioData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  certifications: Certification[];
}

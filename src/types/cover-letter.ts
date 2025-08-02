
import { type Timestamp } from "firebase/firestore";

export interface CoverLetter {
  id: string;
  title: string;
  content: string;
  jobDescription: string;
  companyName: string;
  hiringManager?: string;
  tone: 'Professional' | 'Enthusiastic' | 'Formal' | 'Creative';
  createdAt: Timestamp;
  lastModified: Timestamp;
}

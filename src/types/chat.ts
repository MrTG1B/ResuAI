import { type Timestamp } from "firebase/firestore";
import { type ChatMessage } from "./resume";

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Timestamp;
  lastModified: Timestamp;
}

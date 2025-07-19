
import { type Timestamp } from "firebase/firestore";

export interface ParsedResume {
    htmlContent: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface EditedResume {
    newHtmlContent: string;
    response: string;
}

export interface JobMatchAnalysis {
    matchScore: number;
    matchSummary: string;
    detailedAnalysis: string;
}

export interface CoachChatResponse {
    response: string;
}

export interface SavedEditorState {
    htmlContent: string | null;
    chatHistory: ChatMessage[];
    fileName?: string;
    initialPreviewUri?: string;
    lastModified?: Timestamp;
}

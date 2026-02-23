

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

export interface AtsAnalysis {
    isAtsFriendly: boolean;
    atsFriendlinessScore: number;
    atsSummary: string;
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
    lastModified?: Timestamp | string;
}

export interface ResumeCheck {
    id: string;
    resumeFileName: string;
    jobDescription: string;
    isAtsFriendly: boolean;
    atsFriendlinessScore: number;
    atsSummary: string;
    detailedAnalysis: string;
    createdAt: Timestamp | string;
}

    
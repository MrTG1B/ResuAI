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

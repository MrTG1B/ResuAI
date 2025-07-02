export interface ParsedResume {
    rawText: string;
    // Future structured data can be added here
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface EditedResume {
    newRawText: string;
    response: string;
}

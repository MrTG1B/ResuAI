export interface ParsedResume {
    rawText: string;
    // Future structured data can be added here
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

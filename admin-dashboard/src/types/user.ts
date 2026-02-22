
export type PlanId = 'free' | 'medium' | 'pro' | 'ultra_pro';

export interface User {
    id: string;
    name: string;
    email: string;
    resumes: number;
    portfolios: number;
    coverLetters?: number;
    isBlocked?: boolean;
    disabledTools?: string[];
    plan?: PlanId;
    createdAt?: string;
    lastLogin?: string;
}

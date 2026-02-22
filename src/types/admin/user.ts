import type { PlanId } from '../subscription';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  resumes: number;
  portfolios: number;
  coverLetters: number;
  isBlocked?: boolean;
  disabledTools?: string[];
  createdAt?: string;
  lastLogin?: string;
  plan?: PlanId;
}

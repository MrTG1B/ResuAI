'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/resume-analysis.ts';
import '@/ai/flows/generate-avatar.ts';
import '@/ai/flows/parse-resume.ts';
import '@/ai/flows/edit-resume.ts';
import '@/ai/flows/job-match-analyzer.ts';
import '@/ai/flows/coach-chat.ts';
import '@/ai/flows/generate-project-image.ts';

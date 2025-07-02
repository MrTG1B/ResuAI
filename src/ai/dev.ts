'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/resume-analysis.ts';
import '@/ai/flows/generate-avatar.ts';
import '@/ai/flows/parse-resume.ts';

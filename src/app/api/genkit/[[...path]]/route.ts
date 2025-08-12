'use server';
/**
 * @fileoverview API route handler for all Genkit flows.
 * This catch-all route lets Genkit handle any request under /api/genkit/.
 */

import { appRoute } from '@genkit-ai/next';
import '@/ai/dev'; // Registers all flows in Genkit

// Use a wildcard route handler for all registered flows
export const POST = appRoute();
export const GET = appRoute();
export const OPTIONS = appRoute();

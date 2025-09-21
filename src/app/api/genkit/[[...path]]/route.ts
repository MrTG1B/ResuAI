
'use server';

/**
 * @fileOverview This route is a catch-all for all Genkit flow requests.
 * It uses the Genkit appRoute helper to handle routing and execution.
 */

import { appRoute } from '@genkit-ai/next';
import '@/ai/dev'; // Make sure to import your flows so they are registered.

// Expose all registered flows via the appRoute helper.
export const POST = appRoute({});

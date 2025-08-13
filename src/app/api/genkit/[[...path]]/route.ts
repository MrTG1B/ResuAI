
'use server';

/**
 * @fileOverview This route is a catch-all for all Genkit flow requests.
 * It uses the Genkit Next.js integration to automatically handle
 * requests to any flow defined in the application.
 */

import { createApiRouteHandler } from '@genkit-ai/next';
import '@/ai/dev'; // Make sure to import your flows so they are registered.

export const { GET, POST, OPTIONS } = createApiRouteHandler();

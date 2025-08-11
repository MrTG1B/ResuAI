
'use server';
/**
 * @fileoverview This file is the API route handler for all Genkit flows.
 * It uses the Genkit Next.js plugin to expose flows as API endpoints.
 * The [[...path]] is a catch-all route that allows Genkit to handle any
 * request under /api/genkit/.
 */

import { createApiRouteHandler } from '@genkit-ai/next';
import '@/ai/dev'; // Make sure to import your flows so they are registered.

export const { GET, POST, OPTIONS } = createApiRouteHandler();

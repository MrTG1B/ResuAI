'use server';

/**
 * @fileOverview This is a catch-all Genkit API route that makes all registered
 * flows available as API endpoints.
 *
 * For example, a flow named `myFlow` will be available at `/api/genkit/flow/myFlow`.
 */

import { createApiRouteHandler } from '@genkit-ai/next';
import '@/ai/dev'; // Make sure to import your flows so they are registered.

export const { GET, POST, OPTIONS } = createApiRouteHandler();

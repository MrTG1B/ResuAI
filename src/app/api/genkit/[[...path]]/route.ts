
'use server';

/**
 * @fileOverview This route is a catch-all for all Genkit flow requests.
 * It uses the Genkit appRoute helper to handle routing and execution.
 */

import { appRoute } from '@genkit-ai/next';
import '@/ai/dev'; // Make sure to import your flows so they are registered.

// Expose all registered flows via the appRoute helper.
// export const POST = appRoute();

// Since we are moving to server actions, we disable the appRoute handler.
// This file is kept to ensure all flows are registered for potential direct use,
// but the API endpoint itself will not be active.
export async function POST() {
    return new Response(
        JSON.stringify({ error: 'Genkit flow server is disabled. Use server actions instead.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
}

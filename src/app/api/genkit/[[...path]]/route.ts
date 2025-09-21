'use server';

/**
 * @fileOverview This route is a catch-all for all Genkit flow requests.
 * It dynamically looks up the flow by name from the URL and executes it.
 */

import { appRoute } from '@genkit-ai/next';
import { defineFlow, getFlow } from 'genkit/flow';
import '@/ai/dev'; // Make sure to import your flows so they are registered.

export async function POST(
  request: Request,
  context: { params: { path?: string[] } }
) {
  // The flow name is the last segment after /api/genkit/...
  // e.g., /api/genkit/flow/myFlow -> path is ['flow', 'myFlow'] -> we need 'myFlow'
  const flowName = context.params?.path?.slice(-1)[0];

  if (!flowName) {
    return new Response(JSON.stringify({ error: 'Flow name missing in URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const flow = getFlow(flowName);

    if (!flow) {
      console.error(`Flow "${flowName}" not found.`);
      return new Response(JSON.stringify({ error: `Flow "${flowName}" not found` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Use the appRoute helper to handle the request for the specific flow.
    return appRoute({flow})(request);

  } catch (err: any) {
    console.error(`Error processing flow "${flowName}":`, err);
    return new Response(JSON.stringify({ error: `Error processing flow: ${err.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

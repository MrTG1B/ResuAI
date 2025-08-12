'use server';
/**
 * @fileOverview This route is a catch-all for all Genkit flow requests.
 * It dynamically looks up the flow by name from the URL and executes it.
 */

import { appRoute } from '@genkit-ai/next';
import { getFlow } from '@genkit-ai/core/flow';
import '@/ai/dev'; // Make sure to import your flows so they are registered.

export async function POST(
  request: Request,
  context: { params: { path?: string[] } }
) {
  // The flow name is the first segment in the path (e.g., /api/genkit/generateAptitudeExam)
  const flowName = context.params?.path?.[0];

  if (!flowName) {
    return new Response(JSON.stringify({ error: 'Flow name missing in URL.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const flow = getFlow(flowName);

  if (!flow) {
    console.error(`Flow "${flowName}" not found. Please ensure it is defined and imported in src/ai/dev.ts.`);
    return new Response(JSON.stringify({ error: `Flow "${flowName}" not found.` }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Use the appRoute helper to execute the dynamically found flow
  return appRoute(flow)(request);
}

'use server';

/**
 * @fileOverview This is a dynamic, catch-all Genkit API route that makes all
 * registered flows available as API endpoints. It works by taking the flow name
 * from the URL path, looking it up in the registry, and executing it.
 *
 * For example, a flow with the name 'generateAptitudeExam' will be available at
 * `/api/genkit/generateAptitudeExam`.
 */
import { appRoute } from '@genkit-ai/next';
import { getFlow } from 'genkit';
import '@/ai/dev'; // Make sure to import your flows so they are registered.

export async function POST(
  request: Request,
  {params}: {params: {path?: string[]}}
) {
  // The flow name is the first (and only) segment in the path.
  // e.g., /api/genkit/myFlow -> params.path is ['myFlow']
  const flowName = params.path?.[0];

  if (!flowName) {
    return new Response(JSON.stringify({error: 'Flow name missing in URL'}), {
      status: 400,
      headers: {'Content-Type': 'application/json'},
    });
  }

  const flow = getFlow(flowName);

  if (!flow) {
    console.error(`Flow "${flowName}" not found.`);
    return new Response(
      JSON.stringify({error: `Flow "${flowName}" not found`}),
      {
        status: 404,
        headers: {'Content-Type': 'application/json'},
      }
    );
  }

  // Use the appRoute helper to handle the request for the dynamically found flow.
  return appRoute(flow)(request);
}

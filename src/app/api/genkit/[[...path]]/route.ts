'use server';

import { appRoute } from '@genkit-ai/next';
import { getFlow } from '@genkit-ai/core'; // ✅ Correct import
import '@/ai/dev'; // Make sure flows are registered

export async function POST(
  request: Request,
  context: { params: { path?: string[] } }
) {
  const { params } = await context; // ✅ Await params
  const flowName = params.path?.[0];

  if (!flowName) {
    return new Response(JSON.stringify({ error: 'Flow name missing in URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const flow = getFlow(flowName);

  if (!flow) {
    console.error(`Flow "${flowName}" not found.`);
    return new Response(
      JSON.stringify({ error: `Flow "${flowName}" not found` }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return appRoute(flow)(request); // ✅ This will now find `.run` correctly
}

'use server';
import { appRoute } from '@genkit-ai/next';
import { getFlow } from 'genkit';
import '@/ai/dev'; // Registers all your flows

// Dynamic route for any registered flow
export async function POST(request: Request, { params }: { params: { path?: string[] } }) {
  const flowName = params.path?.[0]; // first path segment after /api/genkit/
  
  if (!flowName) {
    return new Response(JSON.stringify({ error: 'Flow name missing in URL' }), { status: 400 });
  }

  try {
    const flow = getFlow(flowName);
    if (!flow) {
      return new Response(JSON.stringify({ error: `Flow "${flowName}" not found` }), { status: 404 });
    }
  
    // Call appRoute for this specific flow
    return appRoute(flow)(request);
  } catch (error: any) {
    console.error(`Error processing flow "${flowName}":`, error);
    return new Response(JSON.stringify({ error: `An error occurred while processing flow "${flowName}".` }), { status: 500 });
  }
}

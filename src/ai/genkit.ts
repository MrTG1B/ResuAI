import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {vertexAI} from '@genkit-ai/vertexai';
import {config} from 'dotenv';

config();

// Use the dedicated Gemini API key for Google AI.
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Use Vertex AI configuration for cloud-based execution
const projectId = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.NEXT_PUBLIC_VERTEX_AI_LOCATION || 'us-central1';

if (!apiKey && !projectId) {
  console.warn(
    'No Google AI API key or Google Cloud Project ID found. AI features will be disabled. ' +
    'Please set NEXT_PUBLIC_GEMINI_API_KEY for Google AI or NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID for Vertex AI.'
  );
}

// Initialize Genkit with the correctly configured plugin.
// Prefer Vertex AI (cloud agent) when project ID is available, otherwise use Google AI.
export const ai = genkit({
  plugins: projectId 
    ? [vertexAI({projectId, location})]
    : apiKey ? [googleAI({apiKey})] : [],
});

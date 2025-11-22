import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {vertexAI, PluginOptions as VertexAIOptions} from '@genkit-ai/vertexai';
import {config} from 'dotenv';

config();

// Configure Vertex AI (cloud agent) for production environments
// This provides better enterprise features and uses Application Default Credentials
const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
const location = process.env.GCLOUD_LOCATION || 'us-central1';

// Keep Google AI with API key as a fallback option
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Build the list of plugins - we can support both simultaneously
// This allows gradual migration from googleai/* to vertexai/* model references
const plugins: any[] = [];

if (projectId) {
  // Add Vertex AI cloud agent when GCP project is configured
  // This enables vertexai/* model namespace
  console.log(`Vertex AI cloud agent enabled for project: ${projectId}`);
  const vertexConfig: VertexAIOptions = {projectId, location};
  plugins.push(vertexAI(vertexConfig));
}

if (apiKey) {
  // Add Google AI plugin - maintains backward compatibility
  // This enables googleai/* model namespace
  console.log('Google AI plugin enabled');
  plugins.push(googleAI({apiKey}));
}

if (plugins.length === 0) {
  console.warn(
    'No AI configuration found. AI features will be disabled. ' +
    'Set GCLOUD_PROJECT for Vertex AI cloud agent, or NEXT_PUBLIC_GEMINI_API_KEY for Google AI.'
  );
}

// Initialize Genkit with configured plugins
// Both Vertex AI (cloud agent) and Google AI can coexist for gradual migration
export const ai = genkit({
  plugins,
});

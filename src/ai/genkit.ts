import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const primaryApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const secondaryApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY_SECONDARY;

const plugins = [];

// Add the primary plugin if the key exists.
// This one will use the default plugin name 'googleai'.
if (primaryApiKey) {
  plugins.push(googleAI({apiKey: primaryApiKey}));
}

// Add the secondary plugin ONLY if the key exists, and give it a UNIQUE name.
if (secondaryApiKey) {
  plugins.push(
    googleAI({
      name: 'googleai-secondary', // This unique name is critical
      apiKey: secondaryApiKey,
    })
  );
}

// Define the model candidates in order of preference.
// Genkit will try them sequentially until one succeeds.
const modelCandidates = [];

if (primaryApiKey) {
  modelCandidates.push('googleai/gemini-2.0-flash');
  modelCandidates.push('googleai/gemini-2.0-flash-preview-image-generation');
}

if (secondaryApiKey) {
  // Reference the uniquely named secondary plugin for fallback.
  modelCandidates.push('googleai-secondary/gemini-2.0-flash');
  modelCandidates.push('googleai-secondary/gemini-2.0-flash-preview-image-generation');
}

export const ai = genkit({
  plugins,
  model: {
    // Use the ordered list of model candidates for automatic fallback.
    candidates: modelCandidates,
  },
});

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const primaryApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const secondaryApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY_SECONDARY;

const plugins = [];

if (primaryApiKey) {
  // The first plugin will use the default name 'googleai'
  plugins.push(googleAI({apiKey: primaryApiKey}));
}

if (secondaryApiKey) {
  // The second plugin MUST have a unique name to avoid registration conflicts.
  plugins.push(
    googleAI({
      name: 'googleai-secondary',
      apiKey: secondaryApiKey,
    })
  );
}

// Define the model candidates. Genkit will try them in order.
const modelCandidates = [];
if (primaryApiKey) {
  modelCandidates.push('googleai/gemini-2.0-flash');
}
if (secondaryApiKey) {
  // Reference the uniquely named secondary plugin.
  modelCandidates.push('googleai-secondary/gemini-2.0-flash');
}

export const ai = genkit({
  plugins,
  model: {
    // Use the model candidates list. If it's empty, this will gracefully do nothing.
    candidates: modelCandidates,
  },
});

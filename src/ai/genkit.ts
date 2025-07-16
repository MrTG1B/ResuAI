import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const primaryApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const secondaryApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY_SECONDARY;

const plugins = [];

if (primaryApiKey) {
  plugins.push(googleAI({apiKey: primaryApiKey}));
}

if (secondaryApiKey) {
  // Define a different name for the second plugin to avoid conflicts.
  plugins.push(googleAI({apiKey: secondaryApiKey,
    name: 'googleai-secondary',
  }));
}

export const ai = genkit({
  plugins,
  model: {
    // Try the default googleai plugin first, then the secondary one.
    candidates: ['googleai/gemini-2.0-flash', 'googleai-secondary/gemini-2.0-flash'],
  },
});

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Select the API key to use. Prioritize the primary key, fall back to the secondary.
const apiKey =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY_SECONDARY;

if (!apiKey) {
  console.warn(
    'No Google AI API key found. AI features will be disabled. Please set NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY_SECONDARY.'
  );
}

// Initialize Genkit with a single, correctly configured plugin.
export const ai = genkit({
  plugins: apiKey ? [googleAI({apiKey})] : [],
});

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {config} from 'dotenv';

config();

// Use the dedicated Gemini API key.
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    'No Google AI API key found. AI features will be disabled. Please set NEXT_PUBLIC_GEMINI_API_KEY.'
  );
}

// Initialize Genkit with the correctly configured Google AI plugin.
// The API key must be passed to the googleAI() function directly.
export const ai = genkit({
  plugins: apiKey ? [googleAI({apiKey})] : [],
});

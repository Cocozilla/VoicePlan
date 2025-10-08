/**
 * @fileOverview This file is the single source of truth for Genkit initialization and exports.
 * It configures the AI plugin and exports the configured \`ai\` object and model names.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// This is now the central configuration for Genkit.
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY }),
  ],
  enableTracingAndMetrics: false,
});

// Export stable model names for use in all flows.
// Using a standard model to ensure availability.
export const geminiPro = 'googleai/gemini-2.0-flash';

/**
 * @fileOverview This file is the single source of truth for Genkit initialization and exports.
 * It configures the AI plugin and exports the configured `ai` object and model names.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This is now the central configuration for Genkit.
// Next.js automatically handles loading .env.local, so dotenv is not needed here.
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY }),
  ],
});

// Export stable model names for use in all flows.
// Using a standard model to ensure availability.
export const geminiPro = 'googleai/gemini-2.0-flash';

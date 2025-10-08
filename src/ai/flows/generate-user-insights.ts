'use server';

/**
 * @fileOverview This file defines a Genkit flow that analyzes user history to generate personalized insights.
 *
 * - generateUserInsights - A function that takes user\'s plan and itinerary history to return actionable and encouraging insights.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateUserInsightsInputSchema, GenerateUserInsightsOutputSchema } from '@/ai/schemas';
import type { GenerateUserInsightsInput, GenerateUserInsightsOutput } from '@/ai/schemas';

// Internal schema for the prompt, which includes stringified history.
const InternalPromptInputSchema = z.object({
    jsonStringifiedPlans: z.string().describe("The JSON string representation of the user\'s plan history."),
    jsonStringifiedItineraries: z.string().describe("The JSON string representation of the user\'s itinerary history."),
});


export async function generateUserInsights(
  input: GenerateUserInsightsInput
): Promise<GenerateUserInsightsOutput> {
  return generateUserInsightsFlow(input);
}

const generateUserInsightsPrompt = ai.definePrompt({
  name: 'generateUserInsightsPrompt',
  input: { schema: InternalPromptInputSchema },
  output: { schema: GenerateUserInsightsOutputSchema },
  prompt: `You are a friendly and encouraging personal productivity assistant. Your job is to analyze a user\'s history of plans and travels to provide them with short, actionable, and positive insights.\n\nAnalyze the user\'s history provided in JSON format.\n\nYou MUST generate 3-5 unique insights based on the data. Focus on identifying patterns, achievements, and gentle suggestions.\n- Frame insights positively. Instead of \"You are bad at finishing tasks\", say \"You have a few tasks in progress. Let\'s get them done!\".\n- Keep each insight concise (1-2 sentences).\n- Provide a relevant emoji for each insight.\n- Identify a \"Productivity Peak\" day of the week if a pattern exists.\n- Comment on travel patterns if they exist (e.g., \"You seem to love weekend trips!\").\n- Acknowledge achievements like completing a high number of tasks or planning several trips.\n\nDo not make up data. If there is not enough data to generate a meaningful insight, provide a generic encouraging message.\n\nExample Insights:\n- \"This month, you\'ve knocked out 15 tasks! You\'re on a roll! 🚀\"\n- \"Your most productive day of the week is Tuesday. Keep that momentum going! 💪\"\n- \"Weekend warrior! Your last three trips were short getaways. Planning the next one? ✈️\"\n\nUser\'s Plan History:\n{{{jsonStringifiedPlans}}}\n\nUser\'s Itinerary History:\n{{{jsonStringifiedItineraries}}}\n\nYour final output MUST be a single JSON object that strictly adheres to the output schema.\n  `,
});

const generateUserInsightsFlow = ai.defineFlow(
  {
    name: 'generateUserInsightsFlow',
    inputSchema: GenerateUserInsightsInputSchema,
    outputSchema: GenerateUserInsightsOutputSchema,
  },
  async (input) => {
    const internalInput = {
        jsonStringifiedPlans: JSON.stringify(input.planHistory),
        jsonStringifiedItineraries: JSON.stringify(input.itineraryHistory),
    };
    const { output } = await generateUserInsightsPrompt(internalInput);
    
    if (!output) {
      throw new Error("Insight generation failed: The model did not return any output.");
    }
    return output;
  }
);

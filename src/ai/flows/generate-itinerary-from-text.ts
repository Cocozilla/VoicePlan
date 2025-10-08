'use server';

/**
 * @fileOverview This file defines a Genkit flow that analyzes transcribed text to generate or update a structured travel itinerary.
 *
 * - generateItineraryFromText - A function that takes transcribed text (and optionally an existing itinerary) to return a structured itinerary.
 */

import { ai, geminiPro } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateItineraryFromTextInputSchema, GenerateItineraryFromTextOutputSchema } from '@/ai/schemas';
import type { GenerateItineraryFromTextInput, GenerateItineraryFromTextOutput } from '@/ai/schemas';

// Internal schema for the prompt, which includes the stringified itinerary
const InternalPromptInputSchema = GenerateItineraryFromTextInputSchema.extend({
    jsonStringifiedItinerary: z.string().optional().describe("The JSON string representation of the existing itinerary."),
});


export async function generateItineraryFromText(
  input: GenerateItineraryFromTextInput
): Promise<GenerateItineraryFromTextOutput> {
  return generateItineraryFromTextFlow(input);
}

const generateItineraryFromTextPrompt = ai.definePrompt({
  name: 'generateItineraryFromTextPrompt',
  input: { schema: InternalPromptInputSchema },
  output: { schema: GenerateItineraryFromTextOutputSchema },
  model: geminiPro,
  prompt: `You are a travel agent AI. Your job is to create or update a detailed, day-by-day travel itinerary based on the user\'s transcribed voice input.\n\nAnalyze the transcribed text to identify the destination, travel dates, and any planned activities.\n\nYou MUST structure the response as follows:\n1.  Create a descriptive \'title\' for the itinerary (e.g., \"Weekend Trip to Paris\").\n2.  Extract the \'startDate\' and \'endDate\' from the text.\n3.  Group all activities into a \'days\' array. Each element in the array represents one day of the trip.\n4.  For each day, specify the \'day\' number (starting from 1) and a \'title\' for that day\'s theme (e.g., \"Cultural Exploration\").\n5.  For each day, list the \'activities\' in a chronological or logical order. Each activity must have a unique \'id\', a \'time\' (e.g., \"9:00 AM\"), a \'description\', and a \'type\' from the following options: \'travel\', \'food\', \'activity\', \'lodging\'.\n  6. For each activity, you must assign a single, relevant Unicode emoji that visually represents it. For example, for a flight, use \"✈️\", for a museum visit, use \"🏛️\", and for a dinner reservation, use \"🍽️\".\n\n  IMPORTANT: If the transcribed text is too vague or lacks the necessary information (like dates or a clear destination) to create a plausible itinerary, you MUST NOT invent details. Instead, you must return an empty JSON object {}.\n\n  {{#if existingItinerary}}\n  An existing itinerary has been provided. You must update this itinerary based on the new transcribed text.\n  This may involve adding, modifying, or removing activities or changing dates.\n  If an activity is being updated, try to maintain its original properties unless the new text specifies a change.\n  The updated itinerary should be a complete and coherent version of the original one with the new changes incorporated.\n\n  Existing Itinerary:\n  {{{jsonStringifiedItinerary}}}\n  {{/if}}\n\n  Your final output MUST be a single, complete JSON object that strictly adheres to the output schema.\n\n  Transcribed Text:\n  {{{transcribedText}}}\n  `,
});

const generateItineraryFromTextFlow = ai.defineFlow(
  {
    name: 'generateItineraryFromTextFlow',
    inputSchema: GenerateItineraryFromTextInputSchema,
    outputSchema: GenerateItineraryFromTextOutputSchema,
  },
  async (input) => {
    const internalInput: z.infer<typeof InternalPromptInputSchema> = {
        ...input,
        jsonStringifiedItinerary: input.existingItinerary ? JSON.stringify(input.existingItinerary, null, 2) : undefined,
    };
    
    const { output } = await generateItineraryFromTextPrompt(internalInput);
    
    if (!output) {
      throw new Error("Itinerary generation failed: The model did not return any output.");
    }

    // Defensive coding: Ensure all activities have IDs, in case the model forgets.
    if (output.days) {
      output.days.forEach(day => {
        if (day.activities) {
          day.activities.forEach(activity => {
            if (!activity.id) {
              activity.id = `activity-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            }
          });
        }
      });
    }

    return output;
  }
);

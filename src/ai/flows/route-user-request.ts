
'use server';

/**
 * @fileOverview This file defines a Genkit flow that analyzes transcribed text and determines whether to create a plan or an itinerary.
 *
 * - determineAndGenerateContent - A function that takes transcribed text and returns either a structured plan or a travel itinerary.
 */

import { ai, geminiPro } from '@/ai/genkit';
import { z } from 'zod';
import { 
    DetermineAndGenerateContentInputSchema,
    DetermineAndGenerateContentOutputSchema,
    RecognizeIntentOutputSchema,
    GeneratePlanFromTextOutputSchema,
    GenerateItineraryFromTextOutputSchema
} from '@/ai/schemas';
import type { 
    DetermineAndGenerateContentInput,
    DetermineAndGenerateContentOutput,
} from '@/ai/schemas';
import { generatePlanFromText } from './generate-plan-from-text';
import { generateItineraryFromText } from './generate-itinerary-from-text';

// Strongly-typed data shapes derived from Zod schemas
type PlanData = z.infer<typeof GeneratePlanFromTextOutputSchema>;
type ItineraryData = z.infer<typeof GenerateItineraryFromTextOutputSchema>;

// Define a strict literal union for the output type
type OutputType = 'plan' | 'itinerary' | 'unsupported';
type FlowOutput =
  | { type: 'plan'; data: PlanData }
  | { type: 'itinerary'; data: ItineraryData }
  | { type: 'unsupported'; data: null };


export async function determineAndGenerateContent(
  input: DetermineAndGenerateContentInput
): Promise<DetermineAndGenerateContentOutput> {
  return routeUserRequest(input);
}

// Safely normalize the recognized intent to our literal type
function normalizeIntent(rawIntent: unknown): OutputType {
  if (rawIntent === 'createPlan') return 'plan';
  if (rawIntent === 'createItinerary') return 'itinerary';
  return 'unsupported';
}


const recognizeIntentPrompt = ai.definePrompt({
    name: 'recognizeContentIntentPrompt',
    input: { schema: DetermineAndGenerateContentInputSchema },
    output: { schema: RecognizeIntentOutputSchema },
    model: geminiPro,
    prompt: `Analyze the following text and determine the user's primary intent. The user wants to create either a plan (like a to-do list, project plan) or a travel itinerary.\n\n- If the text clearly describes tasks, to-do lists, goals, schedules, or explicitly asks to create a plan, the intent is 'createPlan'.\n- If the text describes a trip, vacation, travel dates, destinations, or explicitly asks for an itinerary, the intent is 'createItinerary'.\n- If the 'context' field is 'plan', it is highly likely the user wants to update or create a plan.\n- If the 'context' field is 'itinerary', it is highly likely the user wants to update or create an itinerary.\n- For anything else that doesn't fit (e.g., simple questions, greetings, unrelated statements), the intent is 'unsupported'.\n\nTranscribed Text:\n{{{transcribedText}}}\n\n{{#if context}}\nCurrent Context: The user is currently viewing a {{context}}.\n{{/if}}\n    `,
});


export const routeUserRequest = ai.defineFlow(
  {
    name: 'routeUserRequest',
    inputSchema: DetermineAndGenerateContentInputSchema,
    outputSchema: DetermineAndGenerateContentOutputSchema,
  },
  async (input): Promise<FlowOutput> => {
    // 1. Recognize Intent
    const { output: intentOutput } = await recognizeIntentPrompt(input);
    const intent = normalizeIntent(intentOutput?.intent);

    // 2. Route to the appropriate generation flow based on the normalized intent
    if (intent === 'plan') {
        const plan = await generatePlanFromText({ transcribedText: input.transcribedText });
        // Use .parse to ensure data conforms to the schema at runtime
        const validatedPlan = GeneratePlanFromTextOutputSchema.parse(plan);
        return { type: 'plan', data: validatedPlan };
    }
    
    if (intent === 'itinerary') {
        const itinerary = await generateItineraryFromText({ transcribedText: input.transcribedText });
         // The itinerary flow can return an empty object for vague input, handle that here.
        if (!itinerary || Object.keys(itinerary).length === 0) {
             return { type: 'unsupported', data: null };
        }
        // Use .parse to ensure data conforms to the schema at runtime
        const validatedItinerary = GenerateItineraryFromTextOutputSchema.parse(itinerary);
        return { type: 'itinerary', data: validatedItinerary };
    }

    // Default to unsupported
    return { type: 'unsupported', data: null };
  }
);

'use server';

/**
 * @fileOverview Voice transcription flow using Genkit.
 *
 * - transcribeVoiceInput - A function that transcribes voice input to text.
 */

import { ai, geminiPro } from '@/ai/genkit';
import { TranscribeVoiceInputInputSchema, TranscribeVoiceInputOutputSchema } from '@/ai/schemas';
import type { TranscribeVoiceInputInput, TranscribeVoiceInputOutput } from '@/ai/schemas';

export async function transcribeVoiceInput(input: TranscribeVoiceInputInput): Promise<TranscribeVoiceInputOutput> {
  return transcribeVoiceInputFlow(input);
}

const transcribeVoiceInputPrompt = ai.definePrompt({
  name: 'transcribeVoiceInputPrompt',
  input: {schema: TranscribeVoiceInputInputSchema},
  output: {schema: TranscribeVoiceInputOutputSchema},
  model: geminiPro,
  prompt: `Transcribe the following audio recording to text:\n\n{{media url=audioDataUri}}`,
});

const transcribeVoiceInputFlow = ai.defineFlow(
  {
    name: 'transcribeVoiceInputFlow',
    inputSchema: TranscribeVoiceInputInputSchema,
    outputSchema: TranscribeVoiceInputOutputSchema,
  },
  async input => {
    const {output} = await transcribeVoiceInputPrompt(input);
    if (!output) {
      throw new Error("Transcription failed: The model did not return any output.");
    }
    return output;
  }
);

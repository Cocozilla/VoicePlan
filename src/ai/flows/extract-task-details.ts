
'use server';

/**
 * @fileOverview This file defines a Genkit flow that is specialized for extracting structured task details from a single piece of text.
 */

import { ai, geminiPro } from '@/ai/genkit';
import { z } from 'zod';

const TaskDetailsSchema = z.object({
  task: z.string().describe('The detailed description of the task.'),
  category: z.string().describe('The category of the task (e.g., "Work", "Personal").'),
  deadline: z.string().optional().describe('The deadline or time for the task, if mentioned.'),
  priority: z.enum(['High', 'Medium', 'Low']).describe('The priority of the task.'),
  emoji: z.string().describe('A single, relevant Unicode emoji for the task.'),
});

export const extractTaskDetailsFlow = ai.defineFlow(
  {
    name: 'extractTaskDetailsFlow',
    inputSchema: z.object({ transcribedText: z.string() }),
    outputSchema: TaskDetailsSchema,
  },
  async ({ transcribedText }) => {
    const prompt = `You are a task analysis expert. Your sole job is to extract the details of a single task from the provided text.

    Transcribed Text: "${transcribedText}"

    You MUST extract the following information:
    - **task**: What is the task?
    - **category**: What category does it belong to (e.g., "Work", "Personal")?
    - **deadline**: If a time or day is mentioned, extract it precisely.
    - **priority**: Determine if the task is High, Medium, or Low priority.
    - **emoji**: Assign a single, relevant Unicode emoji that visually represents the task. If the text contains an emoji shorthand code (like ":briefcase:" or ":tada:"), convert it to the corresponding Unicode character.

    Your output must be a single JSON object that strictly follows the output schema.`;

    const { output } = await ai.generate({
      model: geminiPro,
      prompt,
      output: { schema: TaskDetailsSchema },
    });

    if (!output) {
      throw new Error('Failed to extract task details.');
    }

    return output;
  }
);

'use server';

/**
 * @fileOverview This file defines a Genkit flow that adds subtasks to an existing task based on transcribed text.
 *
 * - addSubtasksToTask - A function that takes an existing task and transcribed text to return the updated task with new subtasks.
 */

import { ai, geminiPro } from '@/ai/genkit';
import { z } from 'zod';
import { AddSubtasksToTaskInputSchema, AddSubtasksToTaskOutputSchema } from '@/ai/schemas';
import type { AddSubtasksToTaskInput, AddSubtasksToTaskOutput } from '@/ai/schemas';

// Internal schema for the prompt, which includes the stringified task.
const InternalPromptInputSchema = AddSubtasksToTaskInputSchema.extend({
    jsonStringifiedTask: z.string().describe("The JSON string representation of the existing task."),
});


export async function addSubtasksToTask(
  input: AddSubtasksToTaskInput
): Promise<AddSubtasksToTaskOutput> {
  return addSubtasksToTaskFlow(input);
}

const addSubtasksToTaskPrompt = ai.definePrompt({
  name: 'addSubtasksToTaskPrompt',
  input: { schema: InternalPromptInputSchema },
  output: { schema: AddSubtasksToTaskOutputSchema },
  model: geminiPro,
  prompt: `You are a personal assistant. Your job is to add subtasks to an existing task based on transcribed user input.\n\nThe user has provided an existing task object and a transcription of their voice describing the new subtasks.\nAnalyze the transcribed text and identify all the individual subtasks mentioned.\n\nFor each new subtask you identify, you MUST:\n1. Assign a unique ID.\n2. Set its \'completed\' status to \'false\'.\n3. Add it to the \'subtasks\' array of the existing task.\n\nIf the \'subtasks\' array already has items, append the new ones. Do not modify any other properties of the existing task.\n\nYour final output MUST be the single, complete, updated task object in JSON format.\n\nExisting Task:\n{{{jsonStringifiedTask}}}\n\nTranscribed Text for Subtasks:\n{{{transcribedText}}}\n  `,
});


const addSubtasksToTaskFlow = ai.defineFlow(
  {
    name: 'addSubtasksToTaskFlow',
    inputSchema: AddSubtasksToTaskInputSchema,
    outputSchema: AddSubtasksToTaskOutputSchema,
  },
  async (input) => {
    // Ensure the incoming task has a subtasks array to avoid errors.
    const taskWithSubtasks = {
      ...input.existingTask,
      subtasks: input.existingTask.subtasks || [],
    };
    
    const internalInput: z.infer<typeof InternalPromptInputSchema> = {
        ...input,
        existingTask: taskWithSubtasks,
        jsonStringifiedTask: JSON.stringify(taskWithSubtasks, null, 2),
    };

    const { output } = await addSubtasksToTaskPrompt(internalInput);
    
    if (!output) {
      throw new Error("Subtask generation failed: The model did not return any output.");
    }

    // Defensive coding: Ensure all subtasks have IDs and a completed status, in case the model forgets.
    if (output.subtasks) {
        let originalSubtaskIds = new Set((taskWithSubtasks.subtasks || []).map(s => s.id));
        output.subtasks.forEach(subtask => {
            if (!subtask.id || originalSubtaskIds.has(subtask.id)) {
                 subtask.id = `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            }
            if (typeof subtask.completed !== 'boolean') {
                subtask.completed = false;
            }
        });
    }

    return output;
  }
);

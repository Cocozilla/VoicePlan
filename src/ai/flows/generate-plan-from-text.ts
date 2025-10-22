
'use server';

/**
 * @fileOverview This file defines a Genkit flow that analyzes transcribed text to generate or update a structured plan.
 * This implementation uses a robust, code-centric approach to updating existing plans to prevent data loss.
 */

import { ai, geminiPro } from '@/ai/genkit';
import { z } from 'zod';
import { GeneratePlanFromTextInputSchema, GeneratePlanFromTextOutputSchema } from '@/ai/schemas';
import type { GeneratePlanFromTextInput, GeneratePlanFromTextOutput as PlanOutput } from '@/ai/schemas';

export async function generatePlanFromText(
  input: GeneratePlanFromTextInput
): Promise<PlanOutput> {
  return generatePlanFromTextFlow(input);
}


// Internal schema for the prompt, which includes the stringified plan.
const InternalPromptInputSchema = GeneratePlanFromTextInputSchema.extend({
    jsonStringifiedPlan: z.string().optional().describe("The JSON string representation of the existing plan."),
});

// This prompt is now ONLY used for creating a brand new plan from scratch.
const generatePlanFromTextPrompt = ai.definePrompt({
  name: 'generatePlanFromTextPrompt',
  input: { schema: InternalPromptInputSchema },
  output: { schema: GeneratePlanFromTextOutputSchema },
  model: geminiPro,
  prompt: `You are a highly intelligent personal assistant. Your primary job is to create or update a structured plan based on transcribed user input.

**Instructions for Creating or Updating a Plan:**

1.  **Analyze the Request**: Carefully read the user's transcribed text.
2.  **Identify Intent**:
    *   If no existing plan is provided, create a new plan from scratch.
    *   If an existing plan is provided, you MUST update it based on the new text. This can involve adding, modifying, or removing tasks and subtasks. Do not simply add new tasks; intelligently merge the changes.

3.  **Structure the Output**:
    *   Give the plan a concise and relevant 'title' and a one-sentence 'summary'.
    *   Group tasks into logical 'categories' (e.g., "Work", "Personal").
    *   For each task, provide a unique 'id', a 'task' description, an 'emoji', 'status' ('To Do', 'In Progress', 'Done'), and 'priority' ('High', 'Medium', 'Low').
    *   If a deadline is mentioned, add a 'deadline' (e.g., "2:00 PM").
    *   If smaller steps are mentioned, create them as 'subtasks' with a unique 'id' and a 'completed' status of 'false'.
    *   If a reminder is mentioned, extract the 'time' and formulate a 'question' for the notification.

**Specific Scenarios:**

*   **Simple To-Do List**: For a list like "I need to buy milk, eggs, and bread," create tasks without deadlines.
*   **Constrained Scheduling**: For "Schedule my workout and a team meeting between 2 pm and 5 pm," logically distribute the tasks within that timeframe, assigning specific deadlines.
*   **Proactive Scheduling**: For "I need to go to the gym, do work, and study, make a plan for me," propose a logical schedule with suggested times.

**IMPORTANT**: Your final output MUST be a single, complete JSON object that strictly follows the output schema.

{{#if existingPlan}}
**Existing Plan to Update**:
{{{jsonStringifiedPlan}}}
{{/if}}

**User's Transcribed Text**:
{{{transcribedText}}}
  `,
});

const generatePlanFromTextFlow = ai.defineFlow(
  {
    name: 'generatePlanFromTextFlow',
    inputSchema: GeneratePlanFromTextInputSchema,
    outputSchema: GeneratePlanFromTextOutputSchema,
  },
  async input => {
    
    const internalInput: z.infer<typeof InternalPromptInputSchema> = {
        ...input,
        jsonStringifiedPlan: input.existingPlan ? JSON.stringify(input.existingPlan, null, 2) : undefined,
    };
    
    const { output } = await generatePlanFromTextPrompt(internalInput);
    
    if (!output) {
      throw new Error("Plan generation failed: The model did not return any output.");
    }

    // Defensive coding: Ensure all tasks and subtasks get IDs, in case the model forgets.
    output.categories?.forEach(category => {
      category.tasks.forEach(task => {
        if (!task.id) {
          task.id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        }
        task.subtasks?.forEach(subtask => {
          if (!subtask.id) {
            subtask.id = `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          }
        });
      });
    });

    return output;
  }
);

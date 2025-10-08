
'use server';

/**
 * @fileOverview This file defines a Genkit flow that analyzes transcribed text to generate or update a structured plan.
 * This implementation uses a robust, code-centric approach to updating existing plans to prevent data loss.
 */

import { ai, geminiPro } from '@/ai/genkit';
import { z } from 'zod';
import { GeneratePlanFromTextInputSchema, GeneratePlanFromTextOutputSchema } from '@/ai/schemas';
import type { GeneratePlanFromTextInput, GeneratePlanFromTextOutput as PlanOutput } from '@/ai/schemas';
import { extractTaskDetailsFlow } from './extract-task-details';

export async function generatePlanFromText(
  input: GeneratePlanFromTextInput
): Promise<PlanOutput> {
  return generatePlanFromTextFlow(input);
}

// This prompt is now ONLY used for creating a brand new plan from scratch.
const generatePlanFromTextPrompt = ai.definePrompt({
  name: 'generatePlanFromTextPrompt',
  input: { schema: z.object({ transcribedText: z.string() }) },
  output: { schema: GeneratePlanFromTextOutputSchema },
  model: geminiPro,
  prompt: `You are a highly intelligent personal assistant. Your primary job is to analyze transcribed text to create a structured plan. You must handle three scenarios:

1.  **Simple To-Do List**: If the user provides a list of tasks without mentioning a schedule or time (e.g., "I need to buy milk, eggs, and bread"), create a plan with those tasks. Do NOT assign any times to the 'deadline' field.

2.  **Constrained Scheduling**: If the user provides tasks AND a specific time window (e.g., "Schedule my workout and a team meeting between 2 pm and 5 pm"), identify the tasks and logically distribute them within that time frame, assigning a specific time to each task's 'deadline' field (e.g., "2:00 PM", "4:00 PM").

3.  **Proactive Scheduling**: If the user asks you to create a schedule without providing a time window (e.g., "I need to go to the gym, do work, study, and read, give those times and make a plan for me"), you MUST propose a logical schedule. Make common-sense assumptions about task duration and order, and assign a reasonable, suggested time to each task's 'deadline' field.

**General Instructions for all scenarios:**
- Your final output must be a single JSON object that strictly follows the output schema.
- Identify all main tasks. If a task has smaller, actionable steps, create them as subtasks.
- For each new task and subtask, you MUST assign a unique ID.
- Set the 'completed' status of all new subtasks to 'false'.
- All newly created tasks should have their status set to 'To Do'.
- Group tasks into logical categories (e.g., "Work", "Personal").
- Determine each task's priority (High, Medium, or Low).
- Assign a single, relevant Unicode emoji that visually represents each task.
- If a reminder is mentioned, extract the time and formulate a simple question for the notification.

Transcribed Text: {{{transcribedText}}}
  `,
});

const generatePlanFromTextFlow = ai.defineFlow(
  {
    name: 'generatePlanFromTextFlow',
    inputSchema: GeneratePlanFromTextInputSchema,
    outputSchema: GeneratePlanFromTextOutputSchema,
  },
  async input => {
    // If there is an existing plan, we use a robust, code-based approach to update it.
    if (input.existingPlan) {
      // 1. Use our specialized flow to extract details for only the NEW task.
      const taskDetails = await extractTaskDetailsFlow({ transcribedText: input.transcribedText });

      // 2. Create the new task object with a unique ID and default status.
      const newTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...taskDetails,
        status: 'To Do' as const,
        subtasks: [],
      };

      // 3. Safely add the new task to the plan using code, not a prompt.
      const updatedPlan: PlanOutput = { ...input.existingPlan };
      const categoryIndex = updatedPlan.categories.findIndex(c => c.category === taskDetails.category);

      if (categoryIndex > -1) {
        // If category exists, add the task to it.
        updatedPlan.categories[categoryIndex].tasks.push(newTask);
      } else {
        // If category does not exist, create it with the new task.
        updatedPlan.categories.push({
          category: taskDetails.category,
          tasks: [newTask],
        });
      }
      
      return updatedPlan;
    } 
    // If there is no existing plan, we use the original prompt-based method to create one from scratch.
    else {
        const { output } = await generatePlanFromTextPrompt({ transcribedText: input.transcribedText });
        
        if (!output) {
          throw new Error("Plan generation failed: The model did not return any output.");
        }

        // Ensure all tasks and subtasks get IDs.
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
  }
);

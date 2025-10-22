
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


// Internal schema for the prompt, which includes the stringified plan.
const InternalPromptInputSchema = GeneratePlanFromTextInputSchema.extend({
    jsonStringifiedPlan: z.string().optional().describe("The JSON string representation of the existing plan."),
});

// This prompt is now ONLY used for creating a brand new plan from scratch or getting the high-level structure of an update.
const generatePlanFromTextPrompt = ai.definePrompt({
  name: 'generatePlanFromTextPrompt',
  input: { schema: InternalPromptInputSchema },
  output: { schema: GeneratePlanFromTextOutputSchema },
  model: geminiPro,
  prompt: `You are a highly intelligent personal assistant. Your primary job is to analyze transcribed text to create or update a structured plan. You must handle three scenarios:

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
    
    const internalInput: z.infer<typeof InternalPromptInputSchema> = {
        ...input,
        jsonStringifiedPlan: input.existingPlan ? JSON.stringify(input.existingPlan, null, 2) : undefined,
    };
    
    // Step 1: Get the high-level structural changes from the main prompt.
    const { output: structuralPlan } = await generatePlanFromTextPrompt(internalInput);
    
    if (!structuralPlan) {
      throw new Error("Plan generation failed: The model did not return any output.");
    }
    
    // Create a set of original task IDs for efficient checking.
    const originalTaskIds = new Set<string>();
    if (input.existingPlan?.categories) {
        input.existingPlan.categories.forEach(cat => cat.tasks.forEach(task => originalTaskIds.add(task.id)));
    }


    // Step 2: Iterate through the structurally-updated plan and enrich new or modified tasks.
    const enrichedCategories = await Promise.all(structuralPlan.categories.map(async category => {
        const enrichedTasks = await Promise.all(category.tasks.map(async task => {
            
            // Ensure every task has an ID. If it's a new task, the model should have given it one.
            // If not, we'll assign one.
            if (!task.id) {
              task.id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            }
            
            // A task is considered "new" if its ID wasn't in the original plan.
            const isNewTask = !originalTaskIds.has(task.id);
            
            if (isNewTask) {
                try {
                    // Call the specialized flow to get details.
                    const details = await extractTaskDetailsFlow({ transcribedText: task.task });
                    
                    // Merge the extracted details into the task.
                    return {
                        ...task,
                        emoji: details.emoji,
                        deadline: details.deadline,
                        priority: details.priority,
                        // We keep the status as 'To Do' by default unless the details flow suggests otherwise.
                        status: task.status || 'To Do',
                    };
                } catch (e) {
                    console.error(`Failed to extract details for task "${task.task}":`, e);
                    // If the details flow fails, return the task as-is to not lose it.
                    return task;
                }
            }
            
            // If the task existed before, just ensure its subtasks have IDs.
            task.subtasks?.forEach(subtask => {
                if (!subtask.id) {
                    subtask.id = `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                }
            });

            return task;
        }));
        
        return { ...category, tasks: enrichedTasks };
    }));

    return {
        ...structuralPlan,
        categories: enrichedCategories,
    };
  }
);

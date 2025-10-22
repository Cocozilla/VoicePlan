
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
  prompt: `You are a highly intelligent personal assistant. Your primary job is to create or update a structured plan based on transcribed user input.

**Instructions for Creating or Updating a Plan:**

1.  **Analyze the Request**: Carefully read the user's transcribed text.
2.  **Identify Intent**:
    *   If no existing plan is provided, create a new plan from scratch, identifying all the tasks mentioned.
    *   If an existing plan is provided, you MUST update it based on the new text. This can involve adding new tasks, modifying the text of existing tasks, or removing tasks. Do not simply add new tasks; intelligently merge the changes.

**IMPORTANT**:
- When creating a plan, just create the tasks with their descriptions. Do NOT add emojis, priorities, deadlines, etc. Another process will handle that.
- When updating a plan, preserve the original IDs of existing tasks. For new tasks, assign a new, unique temporary ID.
- Your final output MUST be a single, complete JSON object of the plan that strictly follows the output schema.

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


/**
 * @fileOverview This file defines the shared Zod schemas and TypeScript types for the AI flows.
 * By centralizing the schemas here, we can ensure consistency and avoid violating Next.js's
 * "use server" constraints in our flow files.
 */
import { z } from 'genkit';

// Base Schemas
export const SubTaskSchema = z.object({
  id: z.string().describe('A unique identifier for the subtask (e.g., a timestamp or a random string).'),
  text: z.string().describe('The description of the subtask.'),
  completed: z.boolean().default(false).describe('Whether the subtask is completed. Must default to false for new subtasks.'),
});

export const TaskSchema = z.object({
  id: z.string().describe('A unique identifier for the task (e.g., a timestamp or a random string).'),
  task: z.string().describe('The description of the task.'),
  emoji: z.string().optional().describe('A single emoji that visually represents the task.'),
  deadline: z.string().optional().describe('The deadline for the task, if any.'),
  priority: z.enum(['High', 'Medium', 'Low']).optional().describe('The priority of the task.'),
  people: z.array(z.string()).optional().describe('A list of people associated with the task.'),
  organizations: z.array(z.string()).optional().describe('A list of organizations associated with the task.'),
  status: z.enum(['To Do', 'In Progress', 'Done']).default('To Do').describe('The current status of the task. Defaults to "To Do" for new tasks.'),
  reminder: z.object({
      time: z.string().describe("The time for the reminder, extracted from the text (e.g., '5pm tomorrow')."),
      question: z.string().describe("A question to ask the user in the reminder notification, inferred from the task (e.g., 'Are you at the gym?').")
  }).optional().describe('A reminder for the task, including the time and a question for the user.'),
  subtasks: z.array(SubTaskSchema).optional().describe('A list of subtasks or detailed steps for completing the main task.'),
});

const CategorySchema = z.object({
  category: z.string().describe('The name of the category for this group of tasks (e.g., "Work", "Personal", "Follow-up").'),
  tasks: z.array(TaskSchema),
});


const ItineraryActivitySchema = z.object({
    id: z.string().describe("A unique identifier for the activity."),
    time: z.string().describe("The time of the activity (e.g., '9:00 AM')."),
    description: z.string().describe("A brief description of the activity."),
    emoji: z.string().optional().describe('A single emoji that visually represents the activity.'),
    type: z.enum(['travel', 'food', 'activity', 'lodging']).describe("The type of activity."),
});

const ItineraryDaySchema = z.object({
    day: z.number().describe("The day number of the itinerary (e.g., 1, 2, 3)."),
    title: z.string().describe("A title for the day's theme (e.g., 'Arrival and Exploration')."),
    activities: z.array(ItineraryActivitySchema),
});


// Schemas for generatePlanFromText flow
export const GeneratePlanFromTextOutputSchema = z.object({
  title: z.string().describe('A concise and relevant title for the generated plan.'),
  summary: z.string().describe('A brief one-sentence summary of the plan.'),
  categories: z
    .array(CategorySchema)
    .describe('A list of categorized tasks.'),
});


export const GeneratePlanFromTextInputSchema = z.object({
  transcribedText: z
    .string()
    .describe('The transcribed text from the user voice input.'),
  template: z
    .string()
    .optional()
    .describe(
      'An optional template to guide the structure of the output. If not provided, a default plan structure will be used.'
    ),
  existingPlan: GeneratePlanFromTextOutputSchema.optional().describe(
    'The existing plan to be updated. If provided, the AI should update this plan based on the transcribed text.'
  ),
});


// Schemas for generateItineraryFromText flow
export const GenerateItineraryFromTextOutputSchema = z.object({
  title: z.string().describe("A concise and relevant title for the generated itinerary."),
  startDate: z.string().describe("The start date of the itinerary (e.g., '2024-12-20')."),
  endDate: z.string().describe("The end date of the itinerary (e.g., '2024-12-27')."),
  days: z.array(ItineraryDaySchema).describe("A list of days, each with its own set of activities."),
});

export const GenerateItineraryFromTextInputSchema = z.object({
  transcribedText: z
    .string()
    .describe('The transcribed text from the user voice input.'),
   existingItinerary: GenerateItineraryFromTextOutputSchema.optional().describe(
    'The existing itinerary to be updated. If provided, the AI should update this itinerary based on the transcribed text.'
  ),
});

// TypeScript Types
export type SubTask = z.infer<typeof SubTaskSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type ItineraryActivity = z.infer<typeof ItineraryActivitySchema>;
export type ItineraryDay = z.infer<typeof ItineraryDaySchema>;
export type GeneratePlanFromTextInput = z.infer<typeof GeneratePlanFromTextInputSchema>;
export type GeneratePlanFromTextOutput = z.infer<typeof GeneratePlanFromTextOutputSchema>;
export type GenerateItineraryFromTextInput = z.infer<typeof GenerateItineraryFromTextInputSchema>;
export type GenerateItineraryFromTextOutput = z.infer<typeof GenerateItineraryFromTextOutputSchema>;
export type StoredPlan = GeneratePlanFromTextOutput & { id: string; userId: string; createdAt: string; updatedAt: string; transcription: string };
export type StoredItinerary = GenerateItineraryFromTextOutput & { id: string; userId: string; createdAt: string; updatedAt: string; transcription: string };


// Schemas for Intent Recognition
export const RecognizeIntentOutputSchema = z.object({
  intent: z.enum(['createPlan', 'createItinerary', 'unsupported'])
    .describe('The recognized intent of the user based on their transcribed text. If the user is not asking to create a plan or itinerary, this should be "unsupported".'),
});
export type RecognizeIntentOutput = z.infer<typeof RecognizeIntentOutputSchema>;


// Schemas for addSubtasksToTask flow
export const AddSubtasksToTaskOutputSchema = TaskSchema;
export type AddSubtasksToTaskOutput = z.infer<typeof AddSubtasksToTaskOutputSchema>;

export const AddSubtasksToTaskInputSchema = z.object({
  existingTask: TaskSchema.describe("The existing task to which subtasks will be added."),
  transcribedText: z.string().describe("The transcribed text from the user's voice input, outlining the subtasks."),
});
export type AddSubtasksToTaskInput = z.infer<typeof AddSubtasksToTaskInputSchema>;

// Schemas for transcribeVoiceInput flow
export const TranscribeVoiceInputInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeVoiceInputInput = z.infer<typeof TranscribeVoiceInputInputSchema>;

export const TranscribeVoiceInputOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio input.'),
});
export type TranscribeVoiceInputOutput = z.infer<typeof TranscribeVoiceInputOutputSchema>;


// Schemas for route-user-request flow (determineAndGenerateContent)
export const DetermineAndGenerateContentInputSchema = z.object({
  transcribedText: z
    .string()
    .describe('The transcribed text from the user voice input.'),
  context: z.enum(['plan', 'itinerary']).optional().describe("The user's current context (e.g., viewing a plan or itinerary)."),
});
export type DetermineAndGenerateContentInput = z.infer<typeof DetermineAndGenerateContentInputSchema>;

export const DetermineAndGenerateContentOutputSchema = z.object({
  type: z.enum(['plan', 'itinerary', 'unsupported']),
  data: z.union([GeneratePlanFromTextOutputSchema, GenerateItineraryFromTextOutputSchema, z.null()]),
});
export type DetermineAndGenerateContentOutput = z.infer<typeof DetermineAndGenerateContentOutputSchema>;


// Schemas for generateUserInsights flow
const InsightSchema = z.object({
    emoji: z.string().describe('A single emoji that visually represents the insight.'),
    text: z.string().describe('The concise, encouraging insight text.'),
});

export const GenerateUserInsightsOutputSchema = z.object({
  insights: z.array(InsightSchema).describe("A list of personalized insights for the user."),
  productivityPeak: z.string().optional().describe("The user's most productive day of the week, if a clear pattern exists."),
});
export type GenerateUserInsightsOutput = z.infer<typeof GenerateUserInsightsOutputSchema>;

export const GenerateUserInsightsInputSchema = z.object({
  planHistory: z.array(GeneratePlanFromTextOutputSchema.extend({ id: z.string(), userId: z.string(), createdAt: z.string(), updatedAt: z.string(), transcription: z.string() })).describe("The user's past plans."),
  itineraryHistory: z.array(GenerateItineraryFromTextOutputSchema.extend({ id: z.string(), userId: z.string(), createdAt: z.string(), updatedAt: z.string(), transcription: z.string() })).describe("The user's past itineraries."),
});
export type GenerateUserInsightsInput = z.infer<typeof GenerateUserInsightsInputSchema>;

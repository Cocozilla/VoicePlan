
'use server';

import { 
  transcribeVoiceInput, 
  determineAndGenerateContent,
  addSubtasksToTask,
  generateItineraryFromText,
  generateUserInsights,
  generatePlanFromText 
} from '@/ai';

import type { 
    TranscribeVoiceInputInput, 
    AddSubtasksToTaskInput, 
    AddSubtasksToTaskOutput,
    GenerateItineraryFromTextInput, 
    GenerateUserInsightsInput, 
    DetermineAndGenerateContentInput, 
    DetermineAndGenerateContentOutput, 
    GeneratePlanFromTextInput, 
    GeneratePlanFromTextOutput
} from '@/ai/schemas';

import type { 
    StoredPlan,
    StoredItinerary,
    GenerateUserInsightsOutput,
    GenerateItineraryFromTextOutput
} from '@/app/types';

// The auth instance will be handled by the client-side Firebase context
// No direct server-side auth import is needed here for these actions.
// Firebase Auth context is passed from the client for user-specific actions.

export async function generateContentFromVoice(input: TranscribeVoiceInputInput & { context?: 'plan' | 'itinerary' }): Promise<{
  content?: DetermineAndGenerateContentOutput;
  transcription?: string;
  error?: string;
}> {
  try {
    const transcriptionResult = await transcribeVoiceInput({ audioDataUri: input.audioDataUri });
    const transcription = transcriptionResult?.transcription;

    if (!transcription) {
      return { error: 'Failed to transcribe audio. The recording might be silent or too short.' };
    }

    const contentInput: DetermineAndGenerateContentInput = { 
        transcribedText: transcription,
        context: input.context,
    };

    const content = await determineAndGenerateContent(contentInput);
    
    if (!content || content.type === 'unsupported' || !content.data) {
        return { transcription, error: "I wasn't able to create a plan or itinerary from that. Please try describing your tasks or trip more directly." };
    }

    return { content, transcription };
  } catch (e) {
    console.error('Error in generateContentFromVoice:', e);
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `An unexpected error occurred on the server: ${message}` };
  }
}

export async function updatePlanFromVoice(input: TranscribeVoiceInputInput & Omit<GeneratePlanFromTextInput, 'transcribedText'>): Promise<{
  updatedPlan?: GeneratePlanFromTextOutput;
  transcription?: string;
  error?: string;
}> {
  try {
    const { transcription } = await transcribeVoiceInput({ audioDataUri: input.audioDataUri });
    if (!transcription) {
      return { error: 'Failed to transcribe audio. The recording might be silent or too short.' };
    }
    const result = await generatePlanFromText({ ...input, transcribedText: transcription });
    return { updatedPlan: result, transcription };
  } catch(e) {
    console.error('Error in updatePlanFromVoice:', e);
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `An unexpected error occurred on the server: ${message}` };
  }
}

export async function updateItineraryFromVoice(input: TranscribeVoiceInputInput & Omit<GenerateItineraryFromTextInput, 'transcribedText'>): Promise<{
  updatedItinerary?: GenerateItineraryFromTextOutput;
  transcription?: string;
  error?: string;
}> {
  try {
    const { transcription } = await transcribeVoiceInput({ audioDataUri: input.audioDataUri });
    if (!transcription) {
      return { error: 'Failed to transcribe audio. The recording might be silent or too short.' };
    }
    const result = await generateItineraryFromText({ ...input, transcribedText: transcription });
     if (!result || Object.keys(result).length === 0) {
        return { error: 'Could not update the itinerary from the provided text. Please ensure it contains enough detail.' };
    }
    return { updatedItinerary: result, transcription };
  } catch(e) {
    console.error('Error in updateItineraryFromVoice:', e);
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `An unexpected error occurred on the server: ${message}` };
  }
}

export async function addSubtasksFromVoice(input: TranscribeVoiceInputInput & Omit<AddSubtasksToTaskInput, 'transcribedText'>): Promise<{
  updatedTask?: AddSubtasksToTaskOutput;
  transcription?: string;
  error?: string;
}> {
  try {
    const { transcription } = await transcribeVoiceInput({ audioDataUri: input.audioDataUri });
    if (!transcription) {
      return { error: 'Failed to transcribe audio. The recording might be silent or too short.' };
    }

    const subtaskInput: AddSubtasksToTaskInput = {
      existingTask: input.existingTask,
      transcribedText: transcription,
    };

    const updatedTask = await addSubtasksToTask(subtaskInput);
    if (!updatedTask) {
      return { error: 'Could not add subtasks from the transcription.' };
    }

    return { updatedTask, transcription };
  } catch (e) {
    console.error('Error in addSubtasksFromVoice:', e);
    const message = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `An unexpected error occurred on the server: ${message}` };
  }
}

export async function fetchUserInsights(input: GenerateUserInsightsInput): Promise<{
  insights?: GenerateUserInsightsOutput;
  error?: string;
}> {
    try {
        const insights = await generateUserInsights(input);
        if (!insights) {
            return { error: 'Could not generate insights from your data.' };
        }
        return { insights };
    } catch (e) {
        console.error('Error in fetchUserInsights:', e);
        const message = e instanceof Error ? e.message : 'An unknown error occurred.';
        return { error: `An unexpected error occurred on the server: ${message}` };
    }
}

// These actions now need to be called from a client component that has access to the initialized Firebase Auth instance.
// They are no longer using a server-side auth instance.

export async function signUpWithEmail(values: { email: string, password: string }) {
    // This function will be removed as it requires a server-side auth instance.
    // The logic will be handled on the client in a future step.
    return { error: "Sign up functionality is being updated." };
}

export async function signInWithEmail(values: { email: string, password: string }) {
    // This function will be removed as it requires a server-side auth instance.
    // The logic will be handled on the client in a future step.
    return { error: "Sign in functionality is being updated." };
}


export async function signOutFromApp() {
    // This function will be removed as it requires a server-side auth instance.
    // The logic will be handled on the client in a future step.
    return { error: "Sign out functionality is being updated." };
}

import type { StoredPlan, StoredItinerary } from '@/ai/schemas';

// Re-export core data structures from the AI schema for easy access
// by components. This centralizes where components should look for types.
export type {
  StoredPlan,
  StoredItinerary,
  Task,
  SubTask,
  ItineraryActivity,
  GeneratePlanFromTextOutput,
  GenerateItineraryFromTextOutput,
  ItineraryDay,
  GenerateUserInsightsOutput
} from '@/ai/schemas';

// --- App-wide Enums and Types ---

// Defines the overall application theme (light or dark mode).
export type AppTheme = 'light' | 'dark';

// Defines the available color themes for the UI.
export type ColorTheme = 'purple' | 'mint' | 'red' | 'blue';

// Defines the possible statuses for a task.
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';


// --- State Management & Content Types ---

// Represents the currently active content view (either a plan or an itinerary).
export type ActiveContent = { type: 'plan', data: StoredPlan } | { type: 'itinerary', data: StoredItinerary } | null;

// Represents the state of asynchronous operations (e.g., voice recording).
export type Status = 'idle' | 'recording' | 'processing' | 'success' | 'error';

// Determines the intended action for a voice recording.
export type RecordingMode = 'newContent' | 'subtask' | 'updatePlan' | 'updateItinerary';


// --- UI Event Triggers ---

// Used to trigger a confetti animation for a specific element ID.
export type ConfettiTrigger = {
    id: string;
    timestamp: number;
} | null;

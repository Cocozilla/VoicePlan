// Next.js App Router route handler for Genkit.
import { appRoute } from '@genkit-ai/next';
import { routeUserRequest } from '@/ai/flows/route-user-request';

// Import the main Genkit configuration and all the flow files.
// This is essential to register the flows with the Next.js server.
import '@/ai/genkit';
import '@/ai/flows/add-subtasks-to-task';
import '@/ai/flows/generate-itinerary-from-text';
import '@/ai/flows/generate-plan-from-text';
import '@/ai/flows/generate-user-insights';
import '@/ai/flows/transcribe-voice-input';


export const POST = appRoute(routeUserRequest);
export const GET = appRoute(routeUserRequest);

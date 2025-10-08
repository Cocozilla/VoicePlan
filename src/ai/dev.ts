'use server';
import { config } from 'dotenv';
// Explicitly load the .env.local file.
config({ path: '.env.local' });

import '@/ai/genkit'; // This MUST be the first import to configure Genkit.

// Import all the flows to register them with Genkit.
import './flows/add-subtasks-to-task';
import './flows/generate-itinerary-from-text';
import './flows/generate-plan-from-text';
import './flows/generate-user-insights';
import './flows/route-user-request';
import './flows/transcribe-voice-input';

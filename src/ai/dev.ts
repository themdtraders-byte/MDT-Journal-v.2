
'use server';
import { config } from 'dotenv';
config();

// All AI flow imports have been disabled to fix build issues.
// import '@/ai/flows/local-data-audit.ts';
// import '@/ai/flows/text-to-speech.ts';
// import '@/ai/flows/support-assistant.ts';
import '@/ai/flows/trade-parser-flow.ts';
// import '@/ai/flows/trade-analyst.ts';
// import '@/ai/flows/translator.ts';


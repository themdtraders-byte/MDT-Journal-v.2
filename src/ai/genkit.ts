
'use server';

import { genkit, AIMiddleware } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';
import { inspect } from 'util';

// Middleware to log prompts before they are sent to the model.
const promptLogger: AIMiddleware = async (prompt, next) => {
  console.log('Final prompt being sent to the model:');
  console.log(inspect(prompt, { showHidden: false, depth: null, colors: true }));
  return next(prompt);
};


export const ai = genkit({
  plugins: [
    firebase(),
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
  // Disabling the middleware for now to avoid potential build issues, can be re-enabled for debugging.
  // middlewares: [promptLogger],
});


'use server';
/**
 * @fileOverview A text translation AI flow.
 * NOTE: This flow is currently disabled due to build issues.
 */

import {z} from 'zod';

const TranslateInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z.string().describe('The target language to translate the text into (e.g., "Urdu", "Spanish", "English").'),
});
export type TranslateInput = z.infer<typeof TranslateInputSchema>;

const TranslateOutputSchema = z.object({
    translatedText: z.string().describe('The translated text.')
});
export type TranslateOutput = z.infer<typeof TranslateOutputSchema>;

export async function translateText(input: TranslateInput): Promise<TranslateOutput> {
  // AI functionality is disabled. Returning original text.
  return Promise.resolve({
    translatedText: `[Translation disabled] ${input.text}`
  });
}

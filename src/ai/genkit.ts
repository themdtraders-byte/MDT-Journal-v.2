
'use server';

// This file has been intentionally modified to disable Genkit functionality
// due to persistent build errors. The AI features will not work until
// the underlying dependency issues are resolved.

export const ai = {
    defineFlow: (config: any, fn: any) => fn,
    definePrompt: (config: any, fn: any) => fn,
    defineTool: (config: any, fn: any) => fn,
};

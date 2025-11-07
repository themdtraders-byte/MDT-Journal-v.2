'use server';

/**
 * @fileOverview A logic-based support assistant for the MD Journal application.
 * It uses keyword matching to provide relevant help and navigation actions.
 */

import { z } from 'zod';

const SupportActionSchema = z.object({
    label: z.string().describe('A short, user-facing label for the action button.'),
    path: z.string().describe("The application path to navigate to when the button is clicked. E.g., '/plans/strategy'."),
}).optional();

const SupportAssistantInputSchema = z.object({
  query: z.string().describe('The user question about the application.'),
  currentPath: z.string().describe('The current application path the user is on, for context.'),
});
export type SupportAssistantInput = z.infer<typeof SupportAssistantInputSchema>;

const SupportAssistantOutputSchema = z.object({
  response: z.string().describe('The helpful, user-facing response to the query.'),
  action: SupportActionSchema.describe('An optional action the user can take.'),
});
export type SupportAssistantOutput = z.infer<typeof SupportAssistantOutputSchema>;

// --- Logic-Based "My Assistant" ---

type KeywordMapping = {
    keywords: string[];
    response: string;
    action?: { label: string; path: string; };
};

const mappings: KeywordMapping[] = [
    { keywords: ['strategy', 'plan', 'rules', 'build'], response: "You can create and manage your trading strategies and plans in the 'Build Up' section.", action: { label: "Go to Build Up", path: "/plans/strategy" } },
    { keywords: ['log', 'add', 'new trade'], response: "You can add a new trade using the 'Add New Trade' button in the header or through the 'Let's Trade' checklist.", action: { label: "Go to Let's Trade", path: "/steps" } },
    { keywords: ['chart', 'equity curve', 'performance'], response: "The 'Chart Lab' provides detailed performance charts, including your equity curve, drawdown, and more.", action: { label: "Go to Chart Lab", path: "/performance/chart" } },
    { keywords: ['analytics', 'best', 'worst', 'edge'], response: "Use the 'AI Analytics' page to get a breakdown of your best and worst performing setups, pairs, and times.", action: { label: "Go to Analytics", path: "/performance/analytics" } },
    { keywords: ['import', 'export', 'backup', 'data'], response: "Data import and export functions are available in the Journal Actions dialog, accessible from the book icon in the header.", action: { label: "Open Journal Actions", path: "#" } }, // Path handled by UI
    { keywords: ['theme', 'font', 'color', 'visuals'], response: "You can customize the application's appearance, including themes and fonts, in the 'Settings' menu.", action: { label: "Open Settings", path: "#" } }, // Path handled by UI
    { keywords: ['help', 'support', 'contact'], response: "If you need further assistance, you can browse the FAQs or submit a ticket to our support team.", action: { label: "View FAQs", path: "#" } },
];

export async function getSupportResponse(input: SupportAssistantInput): Promise<SupportAssistantOutput> {
    const query = input.query.toLowerCase();
    
    for (const mapping of mappings) {
        for (const keyword of mapping.keywords) {
            if (query.includes(keyword)) {
                return Promise.resolve({
                    response: mapping.response,
                    action: mapping.action,
                });
            }
        }
    }

    return Promise.resolve({
        response: "I'm sorry, I couldn't find a specific answer for that. Please try rephrasing your question or browse the FAQs for more information.",
        action: undefined,
    });
}

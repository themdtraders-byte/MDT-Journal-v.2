
'use server';

/**
 * @fileOverview An AI flow for parsing trade details from a chart screenshot.
 *
 * This flow uses a multimodal model to analyze an image of a trading chart,
 * extracting key information like entry/exit prices, stop loss, take profit,
 * pair, and direction from visual elements like the TradingView Long/Short Position tool.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { TradeDirection } from '@/types';

// Define the expected input: an image data URI
const TradeParserInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A trading chart screenshot as a data URI, including MIME type and Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TradeParserInput = z.infer<typeof TradeParserInputSchema>;

// Define the structured output we want the AI to return
const TradeParserOutputSchema = z.object({
  pair: z.string().describe('The currency pair or instrument symbol, e.g., "XAUUSD" or "EURUSD".'),
  direction: z.nativeEnum(TradeDirection).describe("The trade direction, either 'Buy' or 'Sell'."),
  entryPrice: z.number().describe('The entry price of the trade.'),
  stopLoss: z.number().describe('The stop-loss price.'),
  takeProfit: z.number().describe('The take-profit price.'),
  openDate: z.string().describe("The date the trade was opened in 'YYYY-MM-DD' format."),
  openTime: z.string().describe("The time the trade was opened in 'HH:MM:SS' format."),
});
export type TradeParserOutput = z.infer<typeof TradeParserOutputSchema>;


/**
 * Parses a trading chart screenshot to extract trade details.
 * @param input The input object containing the image data URI.
 * @returns A promise that resolves to the extracted trade data.
 */
export async function parseTradeFromImage(input: TradeParserInput): Promise<TradeParserOutput> {
  // Call the Genkit flow with the provided input
  return tradeParserFlow(input);
}


// Define the Genkit prompt for the AI model
const tradeParserPrompt = ai.definePrompt({
  name: 'tradeParserPrompt',
  input: { schema: TradeParserInputSchema },
  output: { schema: TradeParserOutputSchema },
  prompt: `You are an expert trading assistant. Your task is to analyze the provided screenshot of a trading chart and extract the details of the trade shown.

Look for the TradingView "Long Position" or "Short Position" information box. This box contains the exact entry price, stop-loss level, and take-profit level.

- From this box, extract the Entry Price, Stop Price (Stop Loss), and Profit Level (Take Profit).
- Determine the trade Direction ('Buy' for a Long Position, 'Sell' for a Short Position).
- Identify the currency pair or instrument symbol (e.g., XAUUSD, EURUSD) from the top-left corner of the chart.
- Identify the date and time of the trade entry from the chart's X-axis, corresponding to the entry point of the position tool.

Return the extracted information in a structured JSON format.

Here is the image:
{{media url=imageDataUri}}`,
});

// Define the Genkit flow that orchestrates the process
const tradeParserFlow = ai.defineFlow(
  {
    name: 'tradeParserFlow',
    inputSchema: TradeParserInputSchema,
    outputSchema: TradeParserOutputSchema,
  },
  async (input) => {
    // Await the response from the AI model
    const { output } = await tradeParserPrompt(input);
    if (!output) {
      throw new Error('Failed to parse trade data from the image.');
    }
    return output;
  }
);

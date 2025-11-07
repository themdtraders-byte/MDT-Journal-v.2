'use server';

/**
 * @fileOverview A logic-based trade analyst that provides feedback on trades.
 * This replaces the previous AI-driven implementation.
 */

import { z } from 'zod';
import type { Trade, SuggestionDetailProps } from '@/types';


const TradeAnalysisOutputSchema = z.object({
  whatWentRight: z.string().describe('A detailed analysis of the positive aspects of the trade, including good decisions and execution.'),
  whatWentWrong: z.string().describe('A constructive critique of the mistakes made, including deviations from the plan or poor decisions.'),
  keyLessons: z.string().describe('A summary of the most important takeaways and lessons from this trade.'),
});
export type TradeAnalysisOutput = z.infer<typeof TradeAnalysisOutputSchema>;

const TradeFeedbackOutputSchema = z.object({
  feedback: z.string().describe('A short, actionable piece of advice based on the trade.'),
  nextStep: z.string().describe('A concrete next step the trader should take.'),
});
export type TradeFeedbackOutput = z.infer<typeof TradeFeedbackOutputSchema>;

const TradingAdviceOutputSchema = z.object({
    advice: z.string().describe("A concise, actionable piece of advice for the trader based on the provided performance metrics for a specific category.")
});
export type TradingAdviceOutput = z.infer<typeof TradingAdviceOutputSchema>;

// --- Logic-Based "My Assistant" for Trade Analysis ---

export async function getTradeAnalysis(trade: Trade): Promise<TradeAnalysisOutput> {
    let whatWentRight = [];
    let whatWentWrong = [];
    let keyLessons = [];

    // Analyze Discipline Score
    if (trade.auto.score.value >= 90) {
        whatWentRight.push("Excellent discipline. You followed your plan almost perfectly.");
    } else if (trade.auto.score.value < 70) {
        whatWentWrong.push(`Discipline was low (${trade.auto.score.value}/100). The main reason was: ${trade.auto.score.remark}`);
        keyLessons.push("Strictly following the trading plan is paramount for long-term consistency.");
    }

    // Analyze P/L and Result
    if (trade.auto.status === 'Win') {
        whatWentRight.push(`The trade was profitable, netting $${trade.auto.pl.toFixed(2)}.`);
        if (trade.auto.result === 'TP') {
            whatWentRight.push("Excellent trade management. The trade hit its planned take profit.");
        } else {
            whatWentWrong.push("The trade was closed manually before hitting the take profit. You may have left money on the table.");
            keyLessons.push("Trust your analysis and let profitable trades run to their target.");
        }
    } else if (trade.auto.status === 'Loss') {
        whatWentWrong.push(`The trade resulted in a loss of $${Math.abs(trade.auto.pl).toFixed(2)}.`);
        if (trade.auto.result !== 'SL') {
            whatWentWrong.push("The trade was closed manually for a loss before hitting the stop loss.");
            keyLessons.push("Let your stop loss do its job. Closing early out of fear can prevent a trade from turning around.");
        }
    }

    // Analyze Risk-to-Reward
    if (trade.auto.rr > 2) {
        whatWentRight.push(`Great risk management with a planned R:R of ${trade.auto.rr.toFixed(1)}:1.`);
    } else {
        whatWentWrong.push("The planned R:R was low. Aim for setups with a higher potential reward for the risk taken.");
    }

    // Default messages if arrays are empty
    if (whatWentRight.length === 0) whatWentRight.push("The trade was executed.");
    if (whatWentWrong.length === 0) whatWentWrong.push("No major mistakes were identified in the automated analysis.");
    if (keyLessons.length === 0) keyLessons.push("Every trade is a learning opportunity. Review your notes to find your own key takeaway.");

    return Promise.resolve({
        whatWentRight: whatWentRight.join(' '),
        whatWentWrong: whatWentWrong.join(' '),
        keyLessons: keyLessons.join(' '),
    });
}

export async function getTradeFeedback(trade: Trade): Promise<TradeFeedbackOutput> {
    if (trade.auto.score.value < 70) {
        return Promise.resolve({
            feedback: "Your discipline score was low on this trade. Focus on following your plan.",
            nextStep: "Review the 'Discipline' section to see what rules were broken."
        });
    }
    if (trade.auto.status === 'Win' && trade.auto.result !== 'TP') {
        return Promise.resolve({
            feedback: "You closed a winning trade early. Are you taking profits out of fear?",
            nextStep: "Analyze the chart to see if the trade would have hit your original take profit."
        });
    }
    if (trade.auto.status === 'Loss' && Math.abs(trade.auto.pl) > (trade.auto.riskPercent / 100) * trade.lotSize * 1000) { // Simplified
        return Promise.resolve({
            feedback: "This loss was larger than your planned risk.",
            nextStep: "Check if you moved your stop loss or if slippage was a factor."
        });
    }
    return Promise.resolve({
        feedback: "A standard trade execution.",
        nextStep: "Log your personal 'Lessons Learned' to capture your own insights."
    });
}

export async function getTradingAdvice({ name, winRate, totalPl, profitFactor, type }: SuggestionDetailProps): Promise<TradingAdviceOutput> {
     if (type === 'best') {
        return Promise.resolve({
            advice: `"${name}" is a clear winner for you with a ${winRate.toFixed(0)}% win rate and a profit factor of ${profitFactor.toFixed(2)}. You should prioritize these setups.`
        });
    } else { // type === 'worst'
        return Promise.resolve({
            advice: `"${name}" is a significant weak spot, leading to a total loss of $${Math.abs(totalPl).toFixed(2)}. Consider avoiding or reducing size on these trades until you can analyze why they fail.`
        });
    }
}

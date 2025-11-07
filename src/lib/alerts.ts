

import type { Trade, Journal, Alert } from "./types";
import { pairsConfig } from "./data";

export const createAlert = (
    category: Alert['category'], 
    type: Alert['type'], 
    message: string,
    tradeId?: string,
    meta?: Record<string, any>
): Alert => ({
    id: crypto.randomUUID(),
    category,
    type,
    message,
    timestamp: new Date().toISOString(),
    seen: false,
    tradeId,
    meta,
});

/**
 * Checks if the last trade was the largest loss in the recent history.
 * @param newTrade The trade that was just added/updated.
 * @param allTrades The user's entire trade history.
 * @returns An Alert object or null.
 */
function checkLargestLoss(newTrade: Trade, allTrades: Trade[]): Alert | null {
    if (newTrade.auto.status !== 'Loss') return null;

    const historicalLosses = allTrades
        .filter(t => t.id !== newTrade.id && t.auto.status === 'Loss')
        .map(t => t.auto.pl);
    
    if (historicalLosses.length < 5) return null; // Need enough data for comparison

    const lowestLoss = Math.min(...historicalLosses);

    if (newTrade.auto.pl < lowestLoss) {
        return createAlert(
            'Largest Loss',
            'Warning',
            `What: This trade is your largest loss in recent history. Why: This can happen due to oversized risk or a failure to cut losses. Next: It's crucial to review this trade's log to understand what happened and prevent a repeat.`,
            newTrade.id
        );
    }
    
    return null;
}

/**
 * Checks if the user is on a winning or losing streak.
 * @param allTrades The user's entire trade history, sorted by date.
 * @param streakLength The required number of wins/losses for the alert.
 * @returns An Alert object or null.
 */
function checkStreaks(allTrades: Trade[], streakLength: number): Alert | null {
    if (allTrades.length < streakLength) return null;

    const recentTrades = allTrades.slice(-streakLength);
    const lastTrade = recentTrades[streakLength - 1];
    const isWinStreak = recentTrades.every(t => t.auto.status === 'Win');
    const isLossStreak = recentTrades.every(t => t.auto.status === 'Loss');
    
    if (!isWinStreak && !isLossStreak) return null;

    // Check if the streak was already reported
    const tradeBeforeStreak = allTrades[allTrades.length - streakLength - 1];
    if (allTrades.length > streakLength && tradeBeforeStreak) {
        if (isWinStreak && tradeBeforeStreak.auto.status === 'Win') return null;
        if (isLossStreak && tradeBeforeStreak.auto.status === 'Loss') return null;
    }

    if(isWinStreak) {
        return createAlert(
            'Win Streak', 'Success',
            `What: You're on a ${streakLength}-trade winning streak! Why: This is a great sign that your strategy is in sync with current market conditions. Next: Stay disciplined, don't get overconfident, and stick to your plan.`,
            lastTrade.id
        );
    }

    if(isLossStreak) {
        return createAlert(
            'Losing Streak', 'Warning',
            `What: You have now lost ${streakLength} trades in a row. Why: This is a critical time. It could be your strategy is out of sync or you are breaking rules. Next: Consider taking a break, reducing risk, and reviewing your journal for common patterns in these losses.`,
            lastTrade.id
        );
    }
    
    return null;
}


/**
 * Checks if a winning trade was closed manually before hitting Take Profit.
 * @param newTrade The trade that was just added/updated.
 * @returns An Alert object or null.
 */
function checkClosedBeforeTP(newTrade: Trade): Alert | null {
    if (newTrade.auto.status !== 'Win' || newTrade.auto.result !== 'Stop' || !newTrade.takeProfit || newTrade.takeProfit === 0) {
        return null;
    }
    
    const pairInfo = pairsConfig[newTrade.pair as keyof typeof pairsConfig] || pairsConfig['Other'];
    const potentialGain = Math.abs(newTrade.takeProfit - newTrade.entryPrice) / pairInfo.pipSize * newTrade.lotSize * pairInfo.pipValue;
    const potentialGainDifference = potentialGain - newTrade.auto.pl;
    

    if (potentialGainDifference < 1) return null; // Don't show for negligible amounts
    
    return createAlert(
        'Closed Before TP',
        'Informational',
        `What: This winning trade was closed manually. Why: This means you left ~$${potentialGainDifference.toFixed(2)} on the table. Was this a strategic decision or was it driven by fear? Next: Reflecting on this can improve your profit-taking.`,
        newTrade.id
    );
}

/**
 * Checks for a correlation between discipline and performance over the last 20 trades.
 * @param allTrades The user's entire trade history.
 * @returns An Alert object or null.
 */
function checkPerformanceVsDiscipline(allTrades: Trade[]): Alert | null {
    if (allTrades.length < 20) return null;

    const recentTrades = allTrades.slice(-20);
    const avgScore = recentTrades.reduce((sum, t) => sum + t.auto.score.value, 0) / recentTrades.length;
    const winRate = recentTrades.filter(t => t.auto.status === 'Win').length / recentTrades.length * 100;
    const profitFactor = Math.abs(recentTrades.filter(t => t.auto.pl > 0).reduce((s,t)=>s+t.auto.pl, 0) / (recentTrades.filter(t => t.auto.pl < 0).reduce((s,t)=>s+t.auto.pl, 0) || 1));

    if (avgScore > 90 && winRate < 40) {
        return createAlert(
            'Discipline vs. Performance',
            'Actionable Insight',
            "What: You are following your rules with high discipline, but your win rate has been low recently. Why: This often means your strategy itself is not aligned with current market conditions. Next: Don't change your disciplined execution. Instead, review your Strategy in the 'Plans' section. It may need adjustment."
        );
    }

    if (avgScore < 70 && profitFactor > 1.5) {
        return createAlert(
            'Discipline vs. Performance',
            'Actionable Insight',
            "What: You are profitable, but your discipline score is low. Why: This indicates your strategy is robust, but you are leaving money on the table by breaking rules. Next: Focus on following your Execution Checklist for every trade to maximize your strategy's potential."
        );
    }
    return null;
}

/**
 * Identifies the best performing setup and checks if it's being under-utilized.
 * @param allTrades The user's entire trade history.
 * @returns An Alert object or null.
 */
function checkUnderusedBestSetup(allTrades: Trade[], journal: Journal): Alert | null {
    if (allTrades.length < 20) return null;

    const statsByStrategy: Record<string, { totalR: number, count: number }> = {};
    allTrades.forEach(trade => {
        if (trade.strategy) {
            if (!statsByStrategy[trade.strategy]) {
                statsByStrategy[trade.strategy] = { totalR: 0, count: 0 };
            }
            const riskAmount = (trade.auto.riskPercent / 100) * journal.capital; // Use capital for consistent R calculation
            if (riskAmount > 0) {
                statsByStrategy[trade.strategy].totalR += trade.auto.pl / riskAmount;
            }
            statsByStrategy[trade.strategy].count++;
        }
    });

    const bestStrategy = Object.entries(statsByStrategy)
        .map(([name, data]) => ({ name, avgR: data.count > 0 ? data.totalR / data.count : 0, count: data.count }))
        .filter(s => s.count >= 5) // Needs a minimum sample size
        .sort((a, b) => b.avgR - a.avgR)[0];
    
    if (bestStrategy && bestStrategy.avgR > 1.5 && bestStrategy.count < allTrades.length * 0.2) {
         return createAlert(
            'Best Setup Underused',
            'Actionable Insight',
            `What: Your best setup, '${bestStrategy.name}', has an impressive average of ${bestStrategy.avgR.toFixed(1)}R. Why: Despite its high performance, you've only used it ${bestStrategy.count} times. Next: You should actively look for more opportunities that fit this high-expectancy setup.`
        );
    }

    return null;
}

/**
 * Analyzes profitability by day of the week.
 * @param allTrades The user's entire trade history.
 * @returns An Alert object or null.
 */
function checkUnprofitablePatterns(allTrades: Trade[]): Alert | null {
    if (allTrades.length < 30) return null;

    const statsByDay: Record<string, { totalPl: number, count: number }> = {};
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    allTrades.forEach(trade => {
        const day = weekdays[new Date(trade.openDate).getDay()];
        if (!statsByDay[day]) statsByDay[day] = { totalPl: 0, count: 0 };
        statsByDay[day].totalPl += trade.auto.pl;
        statsByDay[day].count++;
    });

    const worstDay = Object.entries(statsByDay)
        .filter(([, stats]) => stats.count > 5)
        .sort(([, a], [, b]) => a.totalPl - b.totalPl)[0];
        
    if (worstDay && worstDay[1].totalPl < -100) { // If total loss on that day is significant
        return createAlert(
            'Unprofitable Pattern',
            'Actionable Insight',
            `What: You are consistently unprofitable on ${worstDay[0]}s. Why: Review your ${worstDay[0]} trades to see if market behavior on that day doesn't suit your strategy. Next: Consider reducing your risk or avoiding trading altogether on that day.`
        );
    }
    
    return null;
}

/** NEW CHECKS **/

function checkDirectionalBiasConflict(newTrade: Trade, allTrades: Trade[]): Alert | null {
    if (!newTrade.bias || newTrade.bias.length === 0) return null;

    const isConflicting = newTrade.bias.some(b => 
        (newTrade.direction === 'Buy' && b.structure === 'Bearish') ||
        (newTrade.direction === 'Sell' && b.structure === 'Bullish')
    );

    if (!isConflicting) return null;

    const recentTrades = allTrades.slice(-30);
    const tradesWithBias = recentTrades.filter(t => t.bias && t.bias.length > 0);
    if (tradesWithBias.length < 10) return null;

    const alignedTrades = tradesWithBias.filter(t => !t.bias!.some(b => (t.direction === 'Buy' && b.structure === 'Bearish') || (t.direction === 'Sell' && b.structure === 'Bullish')));
    const conflictingTrades = tradesWithBias.filter(t => t.bias!.some(b => (t.direction === 'Buy' && b.structure === 'Bearish') || (t.direction === 'Sell' && b.structure === 'Bullish')));

    const alignedWinRate = alignedTrades.length > 0 ? (alignedTrades.filter(t => t.auto.status === 'Win').length / alignedTrades.length) * 100 : 0;
    const conflictingWinRate = conflictingTrades.length > 0 ? (conflictingTrades.filter(t => t.auto.status === 'Win').length / conflictingTrades.length) * 100 : 0;
    
    if (alignedWinRate > conflictingWinRate + 15) { // Only alert if there's a significant difference
        return createAlert(
            'Trading against Bias',
            'Warning',
            `What: You traded against your defined bias. Why: This is risky. Your win rate is ${Math.round(alignedWinRate - conflictingWinRate)}% higher when trading WITH your bias. Next: Prioritize setups that align with your HTF bias.`,
            newTrade.id
        );
    }
    
    return null;
}

function checkRiskManagement(newTrade: Trade, allTrades: Trade[]): Alert | null {
    if (allTrades.length < 20) return null;

    const recentLosses = allTrades.filter(t => t.auto.status === 'Loss');
    if (recentLosses.length < 5) return null;

    const avgRiskOnLoss = recentLosses.reduce((sum, t) => sum + t.auto.riskPercent, 0) / recentLosses.length;
    
    if (newTrade.auto.status === 'Loss' && newTrade.auto.riskPercent > avgRiskOnLoss * 1.5) {
        return createAlert(
            'Risk Management',
            'Warning',
            `What: You risked ${newTrade.auto.riskPercent.toFixed(1)}% on this loss, which is significantly higher than your average risk on losing trades. Why: Increasing risk size during a losing period often leads to larger drawdowns. Next: Re-read your trading plan and stick to your defined risk-per-trade.`,
            newTrade.id
        );
    }

    if (newTrade.auto.status === 'Win' && newTrade.auto.riskPercent < avgRiskOnLoss * 0.5) {
        return createAlert(
            'Risk Management',
            'Informational',
            `What: You risked only ${newTrade.auto.riskPercent.toFixed(1)}% on this winning trade. Why: This is great risk management. Your successful trades are using less risk than your average losing trade. Next: Keep up this habit of applying smaller risk on high-conviction setups.`,
            newTrade.id
        );
    }

    return null;
}

function checkProfitTaking(newTrade: Trade, allTrades: Trade[], journal: Journal): Alert | null {
    if (newTrade.auto.status !== 'Win' || allTrades.length < 15) return null;

    const riskAmount = (newTrade.auto.riskPercent / 100) * journal.capital;
    if(riskAmount <= 0) return null;

    const realizedR = newTrade.auto.pl / riskAmount;

    if (realizedR < 1.5) {
        const recentWins = allTrades.filter(t => t.auto.status === 'Win');
        const avgWinR = recentWins.reduce((sum, t) => {
             const rAmount = (t.auto.riskPercent / 100) * journal.capital;
             return rAmount > 0 ? sum + (t.auto.pl / rAmount) : sum;
        }, 0) / (recentWins.length || 1);

        if(avgWinR < 1.5) {
            return createAlert(
                'Profit Taking',
                'Actionable Insight',
                `What: This winning trade had a small R-multiple (${realizedR.toFixed(1)}R). Why: Your recent winning trades average less than 1.5R. This suggests you may be cutting winners short. Next: For your next trade, try to hold for at least 2R.`,
                newTrade.id
            );
        }
    }
    return null;
}

function checkBreakevenRut(allTrades: Trade[]): Alert | null {
    if (allTrades.length < 10) return null;
    const recentTrades = allTrades.slice(-10);
    const beTrades = recentTrades.filter(t => t.auto.result === 'BE');
    if (beTrades.length >= 4) {
        return createAlert(
            'Break-Even Rut',
            'Informational',
            `What: You've had ${beTrades.length} break-even trades in your last 10. Why: This can happen in choppy markets or if your SL is moved to BE too aggressively. Next: Review these trades. Would they have been profitable if you hadn't moved your stop? Consider adjusting your BE strategy.`,
        );
    }
    return null;
}

function checkRRAverage(allTrades: Trade[]): Alert | null {
    if (allTrades.length < 20) return null;
    const avgRR = allTrades.reduce((sum, t) => sum + (t.auto.rr || 0), 0) / allTrades.length;
    if (avgRR < 1.5) {
        return createAlert(
            'Low Risk-to-Reward',
            'Actionable Insight',
            `What: Your average planned R:R is ${avgRR.toFixed(1)}:1. Why: A low R:R requires a very high win rate to be profitable. Next: Seek setups with a minimum of 2:1 R:R to improve your strategy's expectancy.`
        );
    }
    return null;
}

function checkTradingPlanViolations(newTrade: Trade, journal: Journal): Alert | null {
    const plan = journal.plan;
    const remarks: string[] = [];
    if (newTrade.auto.score.value < 70) {
        remarks.push(...newTrade.auto.score.remark.split('. ').filter(r => r));
    }
    
    if (remarks.length > 0) {
        const primaryBreach = remarks[0];
         return createAlert(
            'Rule Breached',
            'Warning',
            `What: You breached your trading plan (${primaryBreach}). Why: Violating rules is the primary cause of unprofitable trading. Next: Before your next trade, re-read your Trading Plan and commit to following it.`,
            newTrade.id
        );
    }
    return null;
}

function checkOvertradingAfterWin(newTrade: Trade, allTrades: Trade[]): Alert | null {
    if (allTrades.length < 2) return null;
    const previousTrade = allTrades[allTrades.length - 2];
    if (previousTrade.auto.pl > 0 && newTrade.auto.pl < 0 && newTrade.lotSize > previousTrade.lotSize * 1.5) {
        return createAlert(
            'Potential Overconfidence',
            'Warning',
            `What: You significantly increased your lot size on this trade after a winner. Why: This pattern, known as 'winner's euphoria', can lead to giving back profits. Next: Stick to your consistent position sizing strategy, regardless of the previous outcome.`,
            newTrade.id
        );
    }
    return null;
}

/**
 * The main analysis engine that runs all checks.
 * @param journal The active journal.
 * @param newOrUpdatedTrade The trade that triggered the analysis.
 * @returns A list of new alerts.
 */
export const runAlertEngine = (journal: Journal, newOrUpdatedTrade: Trade): Alert[] => {
    // Exclude missing trades from all historical analysis
    const liveTrades = journal.trades.filter(t => !t.isMissing);

    // If the new trade itself is a missing trade, don't run any alerts for it.
    if (newOrUpdatedTrade.isMissing) {
        return [];
    }

    const alerts: (Alert | null)[] = [];
    // Ensure the new trade is included in the sorted list for checks like streaks
    const sortedTrades = [...liveTrades.filter(t => t.id !== newOrUpdatedTrade.id), newOrUpdatedTrade]
        .sort((a,b) => new Date(`${a.openDate}T${a.openTime}`).getTime() - new Date(`${b.openDate}T${b.openTime}`).getTime());

    // --- Individual Trade Checks (run every time) ---
    alerts.push(checkLargestLoss(newOrUpdatedTrade, sortedTrades));
    alerts.push(checkClosedBeforeTP(newOrUpdatedTrade));
    alerts.push(checkDirectionalBiasConflict(newOrUpdatedTrade, sortedTrades));
    alerts.push(checkRiskManagement(newOrUpdatedTrade, sortedTrades));
    alerts.push(checkProfitTaking(newOrUpdatedTrade, sortedTrades, journal));
    alerts.push(checkTradingPlanViolations(newOrUpdatedTrade, journal));
    alerts.push(checkOvertradingAfterWin(newOrUpdatedTrade, sortedTrades));

    // --- Streak Checks (run every time) ---
    alerts.push(checkStreaks(sortedTrades, 3));
    alerts.push(checkStreaks(sortedTrades, 5));

    // --- Advanced, periodic checks (run less frequently) ---
    if (liveTrades.length > 0 && liveTrades.length % 10 === 0) { // Every 10 live trades
        alerts.push(checkPerformanceVsDiscipline(sortedTrades));
        alerts.push(checkUnderusedBestSetup(sortedTrades, journal));
        alerts.push(checkUnprofitablePatterns(sortedTrades));
        alerts.push(checkBreakevenRut(sortedTrades));
        alerts.push(checkRRAverage(sortedTrades));
    }
    
    return alerts.filter((alert): alert is Alert => alert !== null);
};


'use client';

import { useMemo } from 'react';
import type { Trade } from '@/types';
import { useJournalStore } from '@/hooks/use-journal-store';
import { cn } from '@/lib/utils';

interface AverageTiltmeterProps extends React.HTMLAttributes<HTMLDivElement> {
  trades: Trade[];
}

const AverageTiltmeter: React.FC<AverageTiltmeterProps> = ({ trades, className, ...props }) => {
    const { journals, activeJournalId, appSettings } = useJournalStore();
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    
    const capital = activeJournal?.capital || 1;

    const overallTiltScore = useMemo(() => {
        if (!trades || trades.length < 1 || !appSettings) return 0;
        
        // --- Calculate Aggregate Metrics ---
        const totalTrades = trades.length;
        const winTrades = trades.filter(t => t.auto.status === 'Win');
        const lossTrades = trades.filter(t => t.auto.status === 'Loss');
        const winRate = totalTrades > 0 ? winTrades.length / totalTrades : 0;
        const avgScore = trades.reduce((sum, t) => sum + t.auto.score.value, 0) / totalTrades;
        
        const grossProfit = winTrades.reduce((sum, t) => sum + t.auto.pl, 0);
        const grossLoss = Math.abs(lossTrades.reduce((sum, t) => sum + t.auto.pl, 0));
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 10 : 0); // Assign high value if no losses

        const totalPl = grossProfit - grossLoss;
        const avgPl = totalTrades > 0 ? totalPl / totalTrades : 0;

        const avgWinPl = winTrades.length > 0 ? grossProfit / winTrades.length : 0;
        const avgLossPl = lossTrades.length > 0 ? grossLoss / lossTrades.length : 0;
        const expectancy = (winRate * avgWinPl) - ((1 - winRate) * avgLossPl);

        // --- Calculate Component Scores [-1 to 1] with Proportional Impact ---
        
        // 1. Avg Score (50% weight): Neutral at 50.
        let scoreComponent = (avgScore - 50) / 50; // Scales from -1 (at score 0) to 1 (at score 100)

        // 2. Profit Factor (10% weight): Neutral at 1.4. Scaled up to a PF of 5.
        const pfComponent = profitFactor >= 1.4 
            ? Math.min(1, (profitFactor - 1.4) / (5 - 1.4)) // Scale from 1.4 (0) to 5 (1)
            : (profitFactor - 1.4) / 1.4; // Scale from 1.4 (0) to 0 (-1)

        // 3. Win Rate (10% weight): Neutral at 50%.
        const wrComponent = (winRate - 0.5) * 2; // Maps 0-100% to -1 to 1

        // 4. Avg P/L (20% weight): Neutral at 0%. Scaled up to 5% of capital for max impact.
        const avgPlPercentOfCapital = capital > 0 ? (avgPl / capital) * 100 : 0;
        const plComponent = avgPlPercentOfCapital > 0 
            ? Math.min(1, avgPlPercentOfCapital / 5) // Scale from 0% (0) to 5% (1)
            : Math.max(-1, avgPlPercentOfCapital / 2.5); // Scale from 0% (0) to -2.5% (-1)

        // 5. Expectancy (10% weight): Neutral at 0. Scaled up to 2.5% of capital for max impact.
        const expectancyPercentOfCapital = capital > 0 ? (expectancy / capital) * 100 : 0;
        const expectancyComponent = expectancy > 0
            ? Math.min(1, expectancyPercentOfCapital / 2.5) // Scale from 0% (0) to 2.5% (1)
            : Math.max(-1, expectancyPercentOfCapital / 1.25); // Scale from 0% (0) to -1.25% (-1)

        // --- Final Weighted Score ---
        const weightedScore = 
            (scoreComponent * 0.5) +
            (pfComponent * 0.1) +
            (wrComponent * 0.1) +
            (plComponent * 0.2) +
            (expectancyComponent * 0.1);

        return weightedScore;

    }, [trades, appSettings, capital]);

    const finalTilt = Math.max(-1, Math.min(1, overallTiltScore)); // Clamped for color/direction logic only
    const barWidth = Math.abs(finalTilt) * 100;
    const isPositive = finalTilt >= 0;

    let colorClass = 'bg-yellow-500'; // Default
    if (finalTilt > 0.5) colorClass = 'bg-green-500';
    else if (finalTilt > 0) colorClass = 'bg-blue-500';
    else if (finalTilt < -0.5) colorClass = 'bg-red-500';
    else if (finalTilt < 0) colorClass = 'bg-orange-500';


    return (
        <div className={cn("flex items-center w-24 h-4", className)} {...props}>
          {/* Left side for negative scores */}
          <div className="w-1/2 h-full flex justify-end items-center pr-0.5">
            {!isPositive && (
              <div className={cn("h-full rounded-[1px]", colorClass)} style={{ width: `${barWidth}%` }} />
            )}
          </div>
          
          <div className="w-[1.5px] h-full bg-muted-foreground/50" />
    
          {/* Right side for positive scores */}
          <div className="w-1/2 h-full flex justify-start items-center pl-0.5">
            {isPositive && (
              <div className={cn("h-full rounded-[1px]", colorClass)} style={{ width: `${barWidth}%` }} />
            )}
          </div>
        </div>
    );
};

export default AverageTiltmeter;

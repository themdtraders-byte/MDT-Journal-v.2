
'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Trade } from '@/types';
import { useJournalStore } from '@/hooks/use-journal-store';

interface TiltmeterProps extends React.HTMLAttributes<HTMLDivElement> {
  trade: Trade;
  realizedR: number; 
}

const Tiltmeter: React.FC<TiltmeterProps> = ({ trade, realizedR, className }) => {
  const { journals, activeJournalId, appSettings } = useJournalStore();
  const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
  
  if (!activeJournal || !appSettings) return null;

  // --- New Tilt Score Calculation Logic ---
  
  // 1. Discipline Score Component (40% weight):
  // Compare to historical average score at the time of the trade.
  const avgScoreAtTime = trade.avgScoreAtTime || 50; // Default to 50 if not present
  const scoreComponent = trade.auto.score.value > avgScoreAtTime ? 1 : -1;

  // 2. Sentiments (20% weight):
  // Ratio of positive to negative emotions.
  const positiveSentiments = (trade.sentiment?.Before?.length || 0) + (trade.sentiment?.During?.length || 0) + (trade.sentiment?.After?.length || 0);
  const negativeSentiments = (appSettings.keywordScores || []).filter(s => 
      s.effect === 'Negative' && (
          (trade.sentiment?.Before || []).includes(s.keyword) ||
          (trade.sentiment?.During || []).includes(s.keyword) ||
          (trade.sentiment?.After || []).includes(s.keyword)
      )
  ).length;
  const totalSentiments = positiveSentiments + negativeSentiments;
  const sentimentComponent = totalSentiments > 0 ? (positiveSentiments - negativeSentiments) / totalSentiments : 0;
  
  // 3. Realized R-Multiple (15% weight):
  const cappedR = Math.max(-3, Math.min(5, realizedR));
  let rComponent;
  if (cappedR >= 1.5) {
    rComponent = (cappedR - 1.5) / (5 - 1.5);
  } else {
    rComponent = (cappedR - 1.5) / (1.5 - (-3));
  }
  rComponent = Math.max(-1, Math.min(1, rComponent));

  // 4. Exit Outcome (10% weight):
  let resultComponent = 0;
  if (trade.auto.outcome === 'Win') resultComponent = 1;
  else if (trade.auto.outcome === 'Loss') resultComponent = -1;
  else resultComponent = 0.1; // Small positive for Break-even

  // 5. Avg P/L (15% weight):
  // Compare to historical average P/L at the time of the trade.
  const avgPlAtTime = trade.avgPlAtTime || 0;
  let plComponent = 0;
  if (avgPlAtTime > 0) {
      // If avg P/L was positive, see how much better/worse this trade was
      plComponent = (trade.auto.pl - avgPlAtTime) / avgPlAtTime;
  } else {
      // If avg P/L was negative or zero, any profit is good.
      plComponent = trade.auto.pl > 0 ? 1 : trade.auto.pl / 100; // Scale losses
  }
  plComponent = Math.max(-1, Math.min(1, plComponent)); // Clamp


  // Calculate final weighted average Tilt Score
  const tiltScore = 
    (scoreComponent * 0.40) + 
    (sentimentComponent * 0.20) +
    (rComponent * 0.15) + 
    (resultComponent * 0.10) +
    (plComponent * 0.15);

  // Clamp the final score to be between -1 and 1 for rendering
  const finalTilt = Math.max(-1, Math.min(1, tiltScore));
  const barWidth = Math.abs(finalTilt) * 100;
  const isPositive = finalTilt >= 0;

  // Refined color scheme
  let colorClass = 'bg-yellow-500'; 
  if (finalTilt > 0.5) colorClass = 'bg-green-500';
  else if (finalTilt > 0) colorClass = 'bg-blue-500';
  else if (finalTilt < -0.5) colorClass = 'bg-red-500';
  else if (finalTilt < 0) colorClass = 'bg-orange-500';


  return (
    <div className={cn("flex items-center w-24 h-6", className)}>
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

export default Tiltmeter;

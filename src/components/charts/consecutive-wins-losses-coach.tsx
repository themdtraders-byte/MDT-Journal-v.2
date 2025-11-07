
'use client';

import { useMemo } from 'react';
import type { Journal, Trade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ConsecutiveWinsLossesCoachProps {
    trades: Trade[];
}

const ConsecutiveWinsLossesCoach = ({ trades }: ConsecutiveWinsLossesCoachProps) => {
    const router = useRouter();

    const analysis = useMemo(() => {
        if (!trades || trades.length < 5) {
             return {
                diagnosis: "Awaiting More Data",
                reason: "Streak analysis requires a larger sample size to be meaningful.",
                action: "Continue logging trades to unlock insights into your winning and losing cycles."
            };
        }
        
        const sortedTrades = [...trades].sort((a,b) => new Date(`${a.openDate}T${a.openTime}`).getTime() - new Date(`${b.openDate}T${b.openTime}`).getTime());
        
        let winStreaks: number[] = [];
        let lossStreaks: number[] = [];
        let currentWin = 0;
        let currentLoss = 0;

        for (const trade of sortedTrades) {
            if (trade.auto.status === 'Win') {
                if (currentLoss > 0) lossStreaks.push(currentLoss);
                currentLoss = 0;
                currentWin++;
            } else if (trade.auto.status === 'Loss') {
                if (currentWin > 0) winStreaks.push(currentWin);
                currentWin = 0;
                currentLoss++;
            } else {
                if (currentWin > 0) winStreaks.push(currentWin);
                if (currentLoss > 0) lossStreaks.push(currentLoss);
                currentWin = 0;
                currentLoss = 0;
            }
        }
        if (currentWin > 0) winStreaks.push(currentWin);
        if (currentLoss > 0) lossStreaks.push(currentLoss);

        const longestWinningStreak = Math.max(0, ...winStreaks);
        const longestLosingStreak = Math.max(0, ...lossStreaks);
        const avgWinningStreak = winStreaks.length > 0 ? winStreaks.reduce((s, c) => s + c, 0) / winStreaks.length : 0;
        const avgLosingStreak = lossStreaks.length > 0 ? lossStreaks.reduce((s, c) => s + c, 0) / lossStreaks.length : 0;

        const currentStreakType = currentWin > 0 ? 'winning' : (currentLoss > 0 ? 'losing' : null);
        const currentStreakLength = Math.max(currentWin, currentLoss);

        // Rule 1 & 2
        if (currentStreakType === 'winning') {
            if (currentStreakLength > longestWinningStreak) {
                 return {
                    diagnosis: "You are currently on a record-breaking winning streak!",
                    reason: "This is the longest winning streak you've ever had. It shows that your strategy is perfectly aligned with the current market conditions.",
                    action: "Enjoy this moment, but don't become overconfident. Go to your AI Analyser to find out what you are doing right so you can replicate this success.",
                    actionPath: '/performance/analytics'
                };
            }
            if (currentStreakLength > avgWinningStreak) {
                 return {
                    diagnosis: "You are in a normal winning streak.",
                    reason: "This streak is a statistically expected event for your strategy. It's a great sign that your system is working.",
                    action: "Continue to execute your plan with discipline. Do not let greed or overconfidence cause you to break your rules."
                };
            }
        }
        
        // Rule 4 & 5
        if (currentStreakType === 'losing') {
            if (currentStreakLength > longestLosingStreak) {
                return {
                    diagnosis: "Warning: You are in a record-breaking losing streak.",
                    reason: "This is the longest string of consecutive losses your account has ever seen. This requires a firm check on your emotions and discipline.",
                    action: "You must stop trading immediately. Go to the AI Analyser and filter for the trades in this streak to find the common mistake you're making.",
                    actionPath: '/performance/analytics'
                };
            }
             if (currentStreakLength > avgLosingStreak) {
                 return {
                    diagnosis: "You are in a normal, expected losing streak.",
                    reason: `This streak is a statistical reality of your trading strategy. Losing streaks of this length have happened before.`,
                    action: "Trust your system. The Equity Chart shows that profitable periods will follow. This is where most traders fail. Stay disciplined."
                };
            }
        }
        
        // Rule 6
        if (avgWinningStreak < 3 && avgLosingStreak < 3 && trades.length > 50) {
             return {
                diagnosis: "Your trading is characterized by a high frequency of short streaks.",
                reason: "Your wins and losses are often balanced. Your system is not built to capture long, sustained moves. It is a 'grinding' style of trading.",
                action: "Understand your trading style. Focus on consistency over large wins. Go to your R-Distribution Chart to confirm your average R-Multiple is small."
            };
        }


        // Default fallback message
        return {
            diagnosis: "Streak analysis complete.",
            reason: "Your winning and losing streaks are within normal historical parameters for your strategy.",
            action: "Continue executing your plan. Streaks, both winning and losing, are a normal part of trading."
        };
        
    }, [trades]);

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    Streak Coach
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold text-base flex items-center gap-2"><Award className="text-yellow-500" /> Diagnosis</h4>
                    <p className="text-sm text-muted-foreground italic">"{analysis.diagnosis}"</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-base flex items-center gap-2"><TrendingUp className="text-green-500" /> Reason</h4>
                    <p className="text-sm text-muted-foreground">{analysis.reason}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-base flex items-center gap-2"><TrendingDown className="text-red-500" /> Actionable Step</h4>
                    <p className="text-sm text-muted-foreground">{analysis.action}</p>
                </div>
                {analysis.actionPath && (
                    <div className="text-right">
                        <Button size="sm" onClick={() => router.push(analysis.actionPath!)}>Go to {analysis.actionPath.split('/').pop()}</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ConsecutiveWinsLossesCoach;

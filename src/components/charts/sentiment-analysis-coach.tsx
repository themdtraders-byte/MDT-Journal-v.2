
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Journal, Trade } from '@/types';

type SentimentDataPoint = {
    trade: number;
    before: number;
    during: number;
    after: number;
    tradeObject?: Trade;
};

interface SentimentAnalysisCoachProps {
    data: SentimentDataPoint[];
}

const SentimentAnalysisCoach = ({ data }: SentimentAnalysisCoachProps) => {
    const router = useRouter();

    const analysis = useMemo(() => {
        if (!data || data.length < 5) {
            return {
                diagnosis: "Awaiting More Data",
                reason: "Sentiment analysis requires more trades to identify meaningful psychological patterns.",
                action: "Continue to log your 'Before', 'During', and 'After' sentiments for each trade."
            };
        }

        const lastPoint = data[data.length - 1];
        
        // Rule 1: 'After' score is consistently negative
        const last10AfterScores = data.slice(-10).map(d => d.after);
        if (last10AfterScores.every(score => score < 0)) {
            return {
                diagnosis: "You are consistently ending your trades with negative emotions.",
                reason: "A negative 'After' score across many trades, regardless of outcome, often points to issues like regret on winning trades (closed too early) or excessive frustration on losing trades.",
                action: "Focus on process over outcome. If you followed your plan, the trade was a success, even if it was a loss. This mindset shift is crucial."
            };
        }

        // Rule 2: 'Before' score is consistently negative
        const last10BeforeScores = data.slice(-10).map(d => d.before);
         if (last10BeforeScores.every(score => score < 0)) {
            return {
                diagnosis: "You are consistently starting your trades from a negative mental state.",
                reason: "Entering trades while feeling emotions like FOMO, anxiety, or impatience almost always leads to poor decision-making.",
                action: "Use the 'Execution Steps' checklist. It acts as a gatekeeper, forcing you to be objective and confirm your plan before you can place a trade."
            };
        }
        
        // Rule 3: 'During' score plummets on wins
        const duringDropOnWins = data.filter(d => d.tradeObject?.auto.status === 'Win').slice(-5).every(d => d.during < d.before);
        if(duringDropOnWins && data.length > 10) {
            return {
                diagnosis: "You feel worse during winning trades.",
                reason: "This is a classic sign of fear. You are likely so afraid of a winning trade turning into a loser that you can't manage it objectively.",
                action: "Trust your Take Profit level. Once a trade is running, your job is to manage the risk, not to stare at the P/L. Let the plan play out."
            };
        }
        
        // Rule 4: All scores are positive and rising
        const isTrendingUp = lastPoint.before > data[0].before && lastPoint.during > data[0].during && lastPoint.after > data[0].after;
        if(isTrendingUp && lastPoint.before > 0 && lastPoint.during > 0 && lastPoint.after > 0) {
             return {
                diagnosis: "You are achieving a state of emotional discipline.",
                reason: "The upward trend across all sentiment phases indicates you are becoming more objective, calm, and process-oriented.",
                action: "Excellent work. This psychological state is your ultimate edge in the market. Maintain these habits."
            };
        }


        // Default message
        return {
            diagnosis: "Sentiment analysis complete.",
            reason: "The chart shows the evolution of your emotional state. An upward trend is good, a downward trend is a warning sign.",
            action: "Pay close attention to the 'After' score. A consistently negative 'After' score, even on winning trades, is a sign of a flawed psychological process."
        };
        
    }, [data]);

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    Sentiment Coach
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
            </CardContent>
        </Card>
    );
};

export default SentimentAnalysisCoach;

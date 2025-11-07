
'use client';
import { Badge } from '@/components/ui/badge';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SuggestionDetailProps } from '@/types';
import { formatNumber } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import FormattedNumber from './ui/formatted-number';

const getFeedback = (type: 'best' | 'worst', pl: number, winRate: number, profitFactor: number) => {
    if (type === 'best') {
        if (pl > 1000 && winRate > 60 && profitFactor > 2) return { text: "Elite Performance", color: "bg-green-500/20 text-green-500" };
        if (pl > 500 || winRate > 55) return { text: "Strong Performer", color: "bg-green-500/20 text-green-400" };
        return { text: "Good Performer", color: "bg-green-500/20 text-green-300" };
    } else {
        if (pl < -500 || winRate < 40) return { text: "Significant Weakness", color: "bg-red-500/20 text-red-500" };
        if (pl < -200 || winRate < 45) return { text: "Needs Review", color: "bg-red-500/20 text-red-400" };
        return { text: "Area for Improvement", color: "bg-yellow-500/20 text-yellow-500" };
    }
}

const SuggestionDetail = ({ name, totalTrades, winRate, avgR, totalPl, avgScore, profitFactor, type, advice }: SuggestionDetailProps & { advice?: string }) => {
    const feedback = getFeedback(type, totalPl, winRate, profitFactor);

    return (
        <div className={cn(
            "p-4 rounded-lg text-center w-full relative space-y-3",
            type === 'best' ? 'bg-green-500/10' : 'bg-red-500/10'
        )}>
            <Badge className={cn("absolute -top-2 right-2", feedback.color)}>
                {feedback.text}
            </Badge>

            <div>
                {type === 'best' ? (
                    <ThumbsUp className="mx-auto text-green-500 mb-2 h-6 w-6"/>
                ) : (
                    <ThumbsDown className="mx-auto text-red-500 mb-2 h-6 w-6"/>
                )}
                
                <p className="font-semibold text-lg">{name}</p>
                <p className="text-xs text-muted-foreground">{totalTrades} trades</p>
            </div>
            
            <div className="text-xs text-left space-y-1">
                <div className="flex justify-between">
                    <span>Win Rate:</span>
                    <span className="font-semibold">{winRate.toFixed(1)}%</span>
                </div>
                 <div className="flex justify-between">
                    <span>Total Trades:</span>
                    <span className="font-semibold">{totalTrades}</span>
                </div>
                <div className="flex justify-between">
                    <span>Avg. Realized R:</span>
                     <span className={cn("font-semibold", avgR >= 0 ? 'text-green-500' : 'text-red-500')}>
                        {avgR.toFixed(2)}R
                    </span>
                </div>
                <div className="flex justify-between">
                    <span>Total P/L:</span>
                    <span className={cn("font-semibold", totalPl >= 0 ? 'text-green-500' : 'text-red-500')}>
                        <FormattedNumber value={totalPl} showPercentage />
                    </span>
                </div>
                 <div className="flex justify-between">
                    <span>Avg. Score:</span>
                    <span className="font-semibold">{avgScore.toFixed(1)}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Profit Factor:</span>
                    <span className="font-semibold">{isFinite(profitFactor) ? profitFactor.toFixed(2) : '∞'}</span>
                </div>
            </div>

            {advice && (
                <Card className="bg-background/40">
                    <CardContent className="p-3 text-left">
                        <div className="flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-xs italic text-muted-foreground">{advice}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default SuggestionDetail;

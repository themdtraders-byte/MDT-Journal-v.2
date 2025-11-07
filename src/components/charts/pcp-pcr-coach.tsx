
'use client';

import { useMemo } from 'react';
import type { Trade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PcpPcrCoachProps {
    trades: Trade[];
}

const PcpPcrCoach = ({ trades }: PcpPcrCoachProps) => {
    const router = useRouter();

    const analysis = useMemo(() => {
        if (!trades || trades.length < 5) {
            return {
                diagnosis: "Awaiting More Data",
                reason: "PCP/PCR analysis requires trades with MFE and TP data to provide meaningful insights.",
                action: "Continue logging trades with MFE/MAE and Take Profit levels to unlock this analysis."
            };
        }

        const validTrades = trades.filter(t => t.auto.mfe > 0 && t.takeProfit && t.takeProfit > 0);
        if (validTrades.length < 5) {
            return {
                diagnosis: "Not Enough Data",
                reason: "Requires at least 5 trades with both MFE and Take Profit values logged.",
                action: "Ensure you are filling out the MFE and Take Profit fields in the trade logging form."
            };
        }

        const totalPcp = validTrades.reduce((sum, t) => {
            const pcp = (t.auto.pips / t.auto.mfe) * 100;
            return sum + (pcp > 100 ? 100 : pcp < -100 ? -100 : pcp);
        }, 0);
        const avgPcp = totalPcp / validTrades.length;
        
        const totalPcr = validTrades.reduce((sum, t) => {
            const potentialPips = Math.abs(t.takeProfit! - t.entryPrice);
            if (potentialPips === 0) return sum;
            return sum + (t.auto.pips / potentialPips);
        }, 0);
        const avgPcr = totalPcr / validTrades.length;

        // Rule 1: High PCP
        if (avgPcp > 80) {
            return {
                diagnosis: "You are excellent at capturing available profit.",
                reason: `An average Profit Capture Percentage (PCP) of ${avgPcp.toFixed(1)}% means you consistently exit trades near their most profitable point (MFE).`,
                action: "This is a sign of great trade management. Review your winning trades to reinforce what you're doing right."
            };
        }
        
        // Rule 2: High PCR
        if (avgPcr > 0.9) {
             return {
                diagnosis: "You are consistently hitting your planned targets.",
                reason: `An average Potential Capture Ratio (PCR) of ${avgPcr.toFixed(2)} shows that your trades are achieving, on average, over 90% of their planned take profit.`,
                action: "Your targeting is effective. Consider if slightly larger TPs could be tested without hurting your win rate."
            };
        }

        // Rule 3: Low PCP
        if (avgPcp < 40) {
            return {
                diagnosis: "You are consistently leaving money on the table.",
                reason: `An average PCP of ${avgPcp.toFixed(1)}% indicates you're exiting winning trades far too early, capturing less than half of their potential move.`,
                action: "Review your trade management. Are you closing trades out of fear? Consider using a trailing stop loss to let your winners run further."
            };
        }

        // Rule 4: Low PCR
        if (avgPcr < 0.5) {
            return {
                diagnosis: "Your Take Profit targets may be unrealistic.",
                reason: `An average PCR of ${avgPcr.toFixed(2)} means you are achieving less than half of your planned target on average. This suggests your TPs are often placed too far away.`,
                action: "Review your Take Profit strategy. The market is telling you that your targets are not being met. Consider setting more conservative TPs based on structure or a lower R:R."
            };
        }
        
        // Default message
        return {
            diagnosis: "Profit capture is within normal parameters.",
            reason: `Your PCP of ${avgPcp.toFixed(1)}% and PCR of ${avgPcr.toFixed(2)} show a balanced approach to taking profits.`,
            action: "Continue monitoring these metrics to ensure your profit-taking strategy remains effective."
        };
        
    }, [trades]);

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    PCP/PCR Coach
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

export default PcpPcrCoach;

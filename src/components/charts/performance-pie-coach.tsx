
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Award, TrendingUp, TrendingDown } from 'lucide-react';

type PieData = {
  name: string;
  trades: number;
  winRate: number;
  totalPl: number;
  profitFactor: number;
};

interface PerformancePieCoachProps {
  data: PieData[];
  title: string;
}

const PerformancePieCoach = ({ data, title }: PerformancePieCoachProps) => {

    const analysis = useMemo(() => {
        if (!data || data.length < 2) {
            return {
                diagnosis: "Awaiting More Data",
                reason: `Need at least two categories to compare performance for "${title}".`,
                action: "Continue logging trades to unlock these insights."
            };
        }

        const sortedByPl = [...data].sort((a, b) => b.totalPl - a.totalPl);
        const best = sortedByPl[0];
        const worst = sortedByPl[sortedByPl.length - 1];

        if (best.name === worst.name) {
           return {
                diagnosis: "Performance is one-sided.",
                reason: `All your trades fall into the "${best.name}" category.`,
                action: `Consider logging trades in other categories to get a comparative analysis.`
            };
        }

        if (best.totalPl > 0 && Math.abs(best.totalPl) > Math.abs(worst.totalPl) * 2 && best.profitFactor > 1.2) {
          return {
            diagnosis: `You have a significant edge when trading "${best.name}".`,
            reason: `Your profits from "${best.name}" trades are substantially larger than your losses from "${worst.name}" trades.`,
            action: `Focus more on "${best.name}" opportunities, as this is a clear area of strength for your strategy.`
          };
        }

        if (worst.totalPl < 0 && worst.trades > 5 && Math.abs(worst.totalPl) > best.totalPl) {
             return {
                diagnosis: `Your performance is being dragged down by "${worst.name}" trades.`,
                reason: `Losses from "${worst.name}" trades are wiping out the gains you're making elsewhere.`,
                action: `Critically review your "${worst.name}" trades. There may be a fundamental flaw in how you approach them.`
            };
        }

        return {
          diagnosis: `Your performance is relatively balanced across categories.`,
          reason: "No single category is dramatically outperforming or underperforming the others.",
          action: "Continue to monitor this chart. Look for small advantages you can exploit or minor weaknesses you can correct."
        };
    }, [data, title]);

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Lightbulb className="text-primary"/>
                    {title} Coach
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold text-lg flex items-center gap-2"><Award className="text-yellow-500" /> Diagnosis</h4>
                    <p className="text-sm text-muted-foreground italic">"{analysis.diagnosis}"</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-lg flex items-center gap-2"><TrendingUp className="text-green-500" /> Reason</h4>
                    <p className="text-sm text-muted-foreground">{analysis.reason}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-lg flex items-center gap-2"><TrendingDown className="text-red-500" /> Actionable Step</h4>
                    <p className="text-sm text-muted-foreground">{analysis.action}</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default PerformancePieCoach;

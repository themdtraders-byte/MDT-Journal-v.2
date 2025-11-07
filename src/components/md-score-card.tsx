

'use client';

import { useMemo } from 'react';
import type { Journal } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Activity, ShieldCheck, TrendingUp, Brain } from '@/components/icons';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Progress } from './ui/progress';

interface MdScoreCardProps {
    scoreData: {
        totalScore: number;
        profitabilityScore: number;
        consistencyScore: number;
        riskManagementScore: number;
        disciplineScore: number;
        feedback: string;
    } | null;
}

const GaugeCircle = ({ value }: { value: number }) => {
    const circumference = 2 * Math.PI * 45; // r = 45
    const strokeDashoffset = circumference - (value / 100) * circumference;

    let colorClass = 'text-green-500';
    if (value < 75) colorClass = 'text-yellow-500';
    if (value < 50) colorClass = 'text-red-500';

    return (
        <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                    className="text-muted/50"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                />
                <circle
                    className={cn("transition-all duration-1000 ease-out", colorClass)}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    transform="rotate(-90 50 50)"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-3xl font-bold", colorClass)}>{value.toFixed(0)}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
        </div>
    );
};

const StatItem = ({ icon: Icon, title, value, tooltip }: { icon: React.ElementType, title: string, value: string, tooltip: string }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-full">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="font-semibold text-lg">{value}</p>
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
)


export default function MdScoreCard({ scoreData }: MdScoreCardProps) {

    if (!scoreData) {
        return (
            <Card className="glassmorphic group">
                <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-xl">
                        <Rocket className="text-primary h-5 w-5 transition-transform duration-300 group-hover:scale-125"/>
                        MD Score
                    </CardTitle>
                    <CardDescription>A holistic measure of your trading performance, combining profitability, consistency, risk management, and discipline.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center gap-2 text-muted-foreground py-8">
                    <Info className="h-5 w-5"/>
                    <p className="text-sm">Need at least 5 trades to calculate a meaningful MD Score.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="glassmorphic group">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Rocket className="text-primary h-5 w-5 transition-transform duration-300 group-hover:scale-125"/>
                    MD Score
                </CardTitle>
                 <CardDescription>
                    A holistic measure of your trading performance, combining profitability, consistency, risk management, and discipline.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-1 flex justify-center">
                        <GaugeCircle value={scoreData.totalScore} />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <StatItem icon={TrendingUp} title="Profitability" value={`${scoreData.profitabilityScore.toFixed(0)} / 30`} tooltip="Based on your Profit Factor. Higher is better."/>
                        <StatItem icon={Activity} title="Consistency" value={`${scoreData.consistencyScore.toFixed(0)} / 30`} tooltip="Based on your Win Rate and return volatility."/>
                        <StatItem icon={ShieldCheck} title="Risk Management" value={`${scoreData.riskManagementScore.toFixed(0)} / 20`} tooltip="Based on how well you stay within your drawdown limits."/>
                        <StatItem icon={Brain} title="Discipline" value={`${scoreData.disciplineScore.toFixed(0)} / 20`} tooltip="Based on your average Discipline Score per trade."/>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

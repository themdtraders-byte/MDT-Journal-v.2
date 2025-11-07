
'use client';

import * as React from 'react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, Legend, Brush, ReferenceLine } from 'recharts';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import SentimentAnalysisCoach from './sentiment-analysis-coach';
import FormattedNumber from '../ui/formatted-number';

const sentimentChartConfig = {
    before: { label: "Before", color: "#3b82f6" }, // blue-500
    during: { label: "During", color: "#22c55e" }, // green-500
    after: { label: "After", color: "#ef4444" }, // red-500
};

const CustomSentimentTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const tradeObject = dataPoint.tradeObject;
    const directionColor = tradeObject?.direction === 'Buy' ? 'bg-green-500' : tradeObject?.direction === 'Sell' ? 'bg-red-500' : 'bg-muted-foreground';
    
    return (
      <div className="rounded-md border bg-background/80 backdrop-blur-sm p-1.5 shadow-sm text-[10px] w-48">
        <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1.5">
                <div className={cn("w-2 h-2 rounded-full", directionColor)} />
                <p className="font-bold text-xs">Trade #{label}</p>
            </div>
             <p className="text-muted-foreground text-[9px]">{dataPoint.tradeObject?.openDate}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {payload.map((p: any) => (
                <React.Fragment key={p.dataKey}>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: p.stroke}}/>
                        <span className="capitalize text-muted-foreground">{p.name}</span>
                    </div>
                    <span className="font-bold ml-auto text-right">{p.value}</span>
                </React.Fragment>
            ))}
             {tradeObject && (
                <>
                    <hr className="col-span-2 border-border/50 my-1"/>
                    <div className="text-muted-foreground">Instrument</div>
                    <div className="font-bold text-right">{tradeObject.pair}</div>
                    <div className="text-muted-foreground">Risk %</div>
                    <div className="font-bold text-right">{tradeObject.auto.riskPercent.toFixed(2)}%</div>
                     <div className="text-muted-foreground">P/L</div>
                    <div className={cn("font-bold text-right", tradeObject.auto.pl >= 0 ? 'text-green-500' : 'text-red-500')}>
                        <FormattedNumber value={tradeObject.auto.pl} />
                    </div>
                </>
             )}
        </div>
         <div className="text-muted-foreground border-t mt-2 pt-1 text-[10px]">
            <p>Sentiments:</p>
            <p>Before: {dataPoint.beforeSentiments.join(', ') || 'N/A'}</p>
            <p>During: {dataPoint.duringSentiments.join(', ') || 'N/A'}</p>
            <p>After: {dataPoint.afterSentiments.join(', ') || 'N/A'}</p>
        </div>
      </div>
    );
  }
  return null;
};

export default function SentimentAnalysisChart({ data, showZoomSlider = false, brushY = 275, onClick }: { data: any[], showZoomSlider?: boolean, brushY?: number, onClick?: (data: any) => void }) {
    const { appSettings } = useJournalStore();
    const keywordScores = appSettings.keywordScores || [];

    if (!data || data.length === 0) {
        return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No sentiment data available.</div>;
    }

    const calculateScore = (sentiments: string[]): number => {
        if (!sentiments || sentiments.length === 0) return 0;
        return sentiments.reduce((score, sentiment) => {
            const scoreEffect = keywordScores.find(ks => ks.keyword.toLowerCase() === sentiment.toLowerCase() && ks.type === 'Sentiment');
            if (scoreEffect?.impact === 'Positive') return score + 1;
            if (scoreEffect?.impact === 'Negative') return score - 1;
            return score;
        }, 0);
    };

    let cumulativeBefore = 0;
    let cumulativeDuring = 0;
    let cumulativeAfter = 0;

    const chartData = data.map(d => {
        const beforeSentiments = d.tradeObject?.sentiment?.Before || [];
        const duringSentiments = d.tradeObject?.sentiment?.During || [];
        const afterSentiments = d.tradeObject?.sentiment?.After || [];

        cumulativeBefore += calculateScore(beforeSentiments);
        cumulativeDuring += calculateScore(duringSentiments);
        cumulativeAfter += calculateScore(afterSentiments);

        return {
            trade: d.trade,
            before: cumulativeBefore,
            during: cumulativeDuring,
            after: cumulativeAfter,
            beforeSentiments,
            duringSentiments,
            afterSentiments,
            tradeObject: d.tradeObject,
        };
    });

    return (
        <div className="space-y-4">
            <Card className="glassmorphic bg-glass-purple">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BrainCircuit className="text-primary" />Sentiment Analysis</CardTitle>
                    <CardDescription>
                        Tracks the cumulative score of your emotions over time. An upward trend suggests improving mindset, while a downward trend may indicate emotional trading.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: showZoomSlider ? 20 : 5 }} onClick={onClick} className={onClick ? 'cursor-pointer' : ''}>
                            <defs>
                                <linearGradient id="sentiment-before" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={sentimentChartConfig.before.color} stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor={sentimentChartConfig.before.color} stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="sentiment-during" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={sentimentChartConfig.during.color} stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor={sentimentChartConfig.during.color} stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="sentiment-after" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={sentimentChartConfig.after.color} stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor={sentimentChartConfig.after.color} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                            <XAxis 
                                dataKey="trade" 
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tickFormatter={(value) => `T${Math.floor(value)}`}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                dy={10}
                            />
                            <YAxis 
                                tickFormatter={(value) => String(value)}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                width={40}
                            />
                            <Tooltip content={<CustomSentimentTooltip />} />
                            <Legend />
                            <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeDasharray="3 3" />
                            <Area type="monotone" dataKey="before" name="Before" stroke={sentimentChartConfig.before.color} fill="url(#sentiment-before)" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }}/>
                            <Area type="monotone" dataKey="during" name="During" stroke={sentimentChartConfig.during.color} fill="url(#sentiment-during)" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }}/>
                            <Area type="monotone" dataKey="after" name="After" stroke={sentimentChartConfig.after.color} fill="url(#sentiment-after)" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }}/>
                            {showZoomSlider && <Brush dataKey="trade" height={5} stroke="#000000" y={234} />}
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <SentimentAnalysisCoach data={chartData} />
        </div>
    );
};

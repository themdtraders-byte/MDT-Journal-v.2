

      
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Brush } from 'recharts';
import { cn } from '@/lib/utils';
import FormattedNumber from '../ui/formatted-number';

type BarChartData = {
  name: string;
  profit: number;
  loss: number;
  trades: number;
  winRate: number;
  totalR: number;
  avgR: number;
  profitFactor: number;
  totalPl: number;
  gainPercent: number;
  expectancy: number;
  avgPl: number;
  avgLotSize: number;
  maxWinStreak: number;
  maxLossStreak: number;
  avgDuration: string;
  avgScore: number;
};

interface PerformanceBarChartProps {
  title: string;
  description?: string;
  data: BarChartData[];
  yAxisLabel?: string;
  showZoomSlider?: boolean;
  children?: React.ReactNode;
  isScrollable?: boolean;
  scrollRef?: React.RefObject<HTMLDivElement>;
  chartWidth?: number;
  controls?: React.ReactNode;
  barColor?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const valueKey = payload[0].dataKey;
        return (
            <div className="rounded-lg border bg-background/80 backdrop-blur-sm p-2 shadow-sm text-xs w-48">
                <p className="font-bold mb-1">{label}</p>
                {valueKey === 'profit' || valueKey === 'loss' || valueKey === 'totalPl' ? (
                     <div className="grid grid-cols-2 gap-x-2">
                        <span className="text-muted-foreground">Trades:</span><span className="font-semibold text-right">{data.trades}</span>
                        <span className="text-muted-foreground">Win Rate:</span><span className="font-semibold text-right">{data.winRate.toFixed(1)}%</span>
                        <span className="text-muted-foreground">Profit:</span><span className={cn("font-semibold text-right", "text-green-500")}><FormattedNumber value={data.profit} /></span>
                        <span className="text-muted-foreground">Loss:</span><span className={cn("font-semibold text-right", "text-red-500")}><FormattedNumber value={data.loss} /></span>
                        <span className="text-muted-foreground">Net P/L:</span><span className={cn("font-semibold text-right", data.totalPl >= 0 ? 'text-green-500' : 'text-red-500')}><FormattedNumber value={data.totalPl} /></span>
                    </div>
                ) : (
                     <div className="grid grid-cols-2 gap-x-2">
                         <span className="text-muted-foreground">Count:</span><span className="font-semibold text-right">{data.trades}</span>
                     </div>
                )}
            </div>
        );
    }
    return null;
};

export default function PerformanceBarChart({ title, description, data, yAxisLabel, showZoomSlider, children, isScrollable, scrollRef, chartWidth, controls, barColor }: PerformanceBarChartProps) {
    const yDomain = useMemo(() => {
        if (!data || data.length === 0) return [0, 0];
        const allValues = data.flatMap(d => barColor ? [d.trades] : [d.profit, d.loss]);
        if (allValues.length === 0 || allValues.every(v => v === undefined || v === null)) return [0, 0];
        const max = Math.max(...allValues.map(v => Number(v)), 0);
        const min = Math.min(...allValues.map(v => Number(v)), 0);
        const padding = Math.max(Math.abs(max), Math.abs(min)) * 0.1;
        return [min - padding, max + padding];
    }, [data, barColor]);

    const yAxisTickFormatter = (value: number) => {
      const numValue = Number(value);
      if(barColor) return numValue.toFixed(0);
      if (Math.abs(numValue) >= 1000) {
        return `$${(numValue / 1000).toFixed(0)}k`;
      }
      return `$${numValue.toFixed(0)}`;
    };

    const chartContent = (
      <ResponsiveContainer width={chartWidth || '100%'} height={300}>
            <BarChart data={data} stackOffset="sign" margin={{ top: 5, right: 20, left: 0, bottom: showZoomSlider ? 20 : 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
                <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    interval={isScrollable ? 'preserveStartEnd' : 'equidistantPreserveStart'}
                    minTickGap={20}
                />
                <YAxis 
                    tickFormatter={yAxisTickFormatter}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    domain={yDomain as [number, number]}
                    label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: {fontSize: '12px'} } : undefined}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}/>
                <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
                 {barColor ? (
                    <Bar dataKey="trades" fill={barColor} stackId="a" name="Trade Count" />
                ) : (
                    <>
                        <Bar dataKey="profit" fill="#22C55E" stackId="stack" name="Profit" />
                        <Bar dataKey="loss" fill="#EF4444" stackId="stack" name="Loss" />
                    </>
                )}
                {showZoomSlider && <Brush dataKey="name" height={15} stroke="hsl(var(--foreground))" y={275} />}
            </BarChart>
        </ResponsiveContainer>
    );

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </div>
                    {controls}
                </div>
            </CardHeader>
            <CardContent>
                {isScrollable ? (
                    <div className="overflow-x-auto pb-4" ref={scrollRef}>
                        {chartContent}
                    </div>
                ) : chartContent}
                {children}
            </CardContent>
        </Card>
    );
}

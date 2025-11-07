

'use client';

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import FormattedNumber from '../ui/formatted-number';
import { ThumbsDown, ThumbsUp, Info } from 'lucide-react';
import PerformancePieCoach from './performance-pie-coach';
import { Tooltip as UiTooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface PerformancePieChartProps {
  title: string;
  data: { 
    name: string; 
    trades: number;
    winRate: number;
    totalPl: number;
    totalR: number;
    avgR: number;
    profitFactor: number;
    expectancy: number;
    avgPl: number;
    avgScore: number;
    avgDuration: string;
  }[];
}

const COLORS = ["#22C55E", "#EF4444", "#3B82F6", "#FBBF24", "#F97316", "#EC4899", "#8B5CF6", "#14B8A6", "#6366F1"];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="rounded-lg border bg-background/80 backdrop-blur-sm p-2 shadow-sm text-xs">
                 <p className="font-bold text-lg mb-2">{data.name}</p>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="text-muted-foreground">Total Trades</div><div className="font-bold text-right">{data.trades}</div>
                    <div className="text-muted-foreground">Win %</div><div className="font-bold text-right">{data.winRate.toFixed(1)}%</div>
                    <div className="text-muted-foreground">Total P/L</div><div className={cn("font-bold text-right", data.totalPl >= 0 ? 'text-green-500' : 'text-red-500')}><FormattedNumber value={data.totalPl} /></div>
                    <div className="text-muted-foreground">Total R</div><div className={cn("font-bold text-right", data.totalR >= 0 ? 'text-green-500' : 'text-red-500')}>{data.totalR.toFixed(2)}R</div>
                    <div className="text-muted-foreground">Average R</div><div className={cn("font-bold text-right", data.avgR >= 0 ? 'text-green-500' : 'text-red-500')}>{data.avgR.toFixed(2)}R</div>
                    <div className="text-muted-foreground">Profit Factor</div><div className="font-bold text-right">{isFinite(data.profitFactor) ? data.profitFactor.toFixed(2) : '∞'}</div>
                 </div>
            </div>
        );
    }
    return null;
}

const ActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';
  const nameParts = payload.name.split(' / ');

  return (
    <g>
      <text x={cx} y={cy} dy={nameParts.length > 1 ? -4 : 8} textAnchor="middle" fill={fill} className="font-bold text-xl">
        {nameParts[0]}
      </text>
       {nameParts.length > 1 && (
        <text x={cx} y={cy} dy="1.2em" textAnchor="middle" fill={fill} className="font-bold text-xl">
          {nameParts[1]}
        </text>
      )}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5} // This creates the zoom effect on hover
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 12}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" className="text-xs">{`${value} trades`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="hsl(var(--muted-foreground))" className="text-xs">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const PieStat = ({ label, value, tooltip, className }: { label: string; value: React.ReactNode; tooltip: string; className?: string }) => (
    <TooltipProvider>
        <UiTooltip>
            <TooltipTrigger asChild>
                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <span>{label}</span>
                        <Info className="h-2.5 w-2.5" />
                    </div>
                    <div className={cn("font-semibold text-right", className)}>{value}</div>
                </div>
            </TooltipTrigger>
            <TooltipContent><p>{tooltip}</p></TooltipContent>
        </UiTooltip>
    </TooltipProvider>
)

export default function PerformancePieChart({ title, data }: PerformancePieChartProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const sortedData = useMemo(() => {
        if (!data || data.length === 0) return { best: null, worst: null };
        const sorted = [...data].sort((a,b) => b.totalPl - a.totalPl);
        return {
            best: sorted[0],
            worst: sorted.length > 1 ? sorted[sorted.length - 1] : null
        }
    }, [data]);

    return (
        <div className="space-y-4">
            <Card className="glassmorphic bg-glass-yellow flex flex-col">
                <CardHeader className="items-center pb-0">
                    <CardTitle className="text-xl">{title}</CardTitle>
                    <CardDescription>A breakdown of trade count and profitability by category.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0 -mt-4">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                             <defs>
                                {data.map((entry, index) => (
                                    <radialGradient id={`gradient-${title.replace(/\s+/g, '-')}-${index}`} key={`gradient-${index}`}>
                                        <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.4} />
                                        <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1} />
                                    </radialGradient>
                                ))}
                            </defs>
                            <Tooltip content={<CustomTooltip />} />
                            <Pie
                                activeIndex={activeIndex}
                                activeShape={ActiveShape}
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="trades"
                                onMouseEnter={onPieEnter}
                                stroke="none"
                            >
                                 {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`url(#gradient-${title.replace(/\s+/g, '-')}-${index})`} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
                 <CardContent className="p-3">
                    <div className="grid grid-cols-2 gap-2">
                        {sortedData.best && (
                            <div className="p-2 rounded-md bg-green-500/10 text-center space-y-2">
                                <h4 className="text-xs font-bold text-green-400 flex items-center justify-center gap-1"><ThumbsUp className="h-3 w-3"/>BEST: {sortedData.best.name}</h4>
                                <div className="space-y-1">
                                    <PieStat label="Trades" value={sortedData.best.trades} tooltip="Total number of trades" />
                                    <PieStat label="Win Rate" value={`${sortedData.best.winRate.toFixed(1)}%`} tooltip="Winning trades / Total trades" />
                                    <PieStat label="Avg P/L" value={<FormattedNumber value={sortedData.best.avgPl}/>} tooltip="Average P/L per trade" />
                                    <PieStat label="Expectancy" value={<FormattedNumber value={sortedData.best.expectancy}/>} tooltip="Expected return per trade" />
                                    <PieStat label="Avg Score" value={sortedData.best.avgScore.toFixed(1)} tooltip="Average discipline score" />
                                    <PieStat label="Avg Duration" value={sortedData.best.avgDuration} tooltip="Average trade holding time" />
                                </div>
                            </div>
                        )}
                        {sortedData.worst && (
                             <div className="p-2 rounded-md bg-red-500/10 text-center space-y-2">
                                <h4 className="text-xs font-bold text-red-400 flex items-center justify-center gap-1"><ThumbsDown className="h-3 w-3"/>WORST: {sortedData.worst.name}</h4>
                                <div className="space-y-1">
                                    <PieStat label="Trades" value={sortedData.worst.trades} tooltip="Total number of trades" />
                                    <PieStat label="Win Rate" value={`${sortedData.worst.winRate.toFixed(1)}%`} tooltip="Winning trades / Total trades" />
                                    <PieStat label="Avg P/L" value={<FormattedNumber value={sortedData.worst.avgPl}/>} tooltip="Average P/L per trade" />
                                    <PieStat label="Expectancy" value={<FormattedNumber value={sortedData.worst.expectancy}/>} tooltip="Expected return per trade" />
                                    <PieStat label="Avg Score" value={sortedData.worst.avgScore.toFixed(1)} tooltip="Average discipline score" />
                                    <PieStat label="Avg Duration" value={sortedData.worst.avgDuration} tooltip="Average trade holding time" />
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            <PerformancePieCoach data={data} title={title} />
        </div>
    );
}

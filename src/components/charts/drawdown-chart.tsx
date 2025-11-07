
"use client"

import * as React from "react"
import { Area, ComposedChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, Brush, Line } from "recharts"
import { cn } from "@/lib/utils"
import FormattedNumber from "../ui/formatted-number"
import type { Trade, Journal } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import DrawdownCoach from "./drawdown-coach"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select"
import { Label } from "../ui/label"
import StatCard from "../ui/stat-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface DrawdownChartProps {
  data: any[]
  journal: Journal | null;
  onClick?: (data: any) => void;
  showZoomSlider?: boolean;
  brushY?: number;
}


const CustomTooltip = ({ active, payload, label, displayMode, initialDeposit }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const tradeObject = data.tradeObject;
    const directionColor = tradeObject?.direction === 'Buy' ? 'bg-green-500' : tradeObject?.direction === 'Sell' ? 'bg-red-500' : 'bg-muted-foreground';
    
    const displayValue = displayMode === 'percentage' ? data.drawdownPercent : data.drawdown;
    const formattedValue = displayMode === 'percentage' 
        ? `${displayValue.toFixed(2)}%` 
        : <FormattedNumber value={displayValue} />;


    return (
      <div className="rounded-md border bg-background/80 backdrop-blur-sm p-1.5 shadow-sm text-[10px] w-48">
        <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1.5">
                <div className={cn("w-2 h-2 rounded-full", directionColor)} />
                <p className="font-bold text-xs">{`T #${data.trade}`}</p>
            </div>
            <p className="text-muted-foreground text-[9px]">{data.tradeObject?.openDate}</p>
        </div>
        
        <div className="space-y-0.5">
             <DetailItem label="Drawdown" value={formattedValue} valueClassName="text-red-500" />
             <DetailItem label="Peak Balance" value={<FormattedNumber value={data.peakBalance} />} />
             <DetailItem label="Current Balance" value={<FormattedNumber value={data.balance} />} />
             {tradeObject && (
                <>
                    <hr className="border-border/50 my-1"/>
                    <DetailItem label="Instrument" value={tradeObject.pair} />
                    <DetailItem label="Risk %" value={`${tradeObject.auto.riskPercent.toFixed(2)}%`} />
                    <DetailItem label="R:R" value={tradeObject.auto.rr.toFixed(1)} />
                    <DetailItem label="P/L" value={<FormattedNumber value={tradeObject.auto.pl} />} valueClassName={tradeObject.auto.pl >= 0 ? 'text-green-500' : 'text-red-500'} />
                </>
             )}
        </div>
      </div>
    )
  }
  return null
}

const DetailItem = ({ label, value, valueClassName }: { label: string, value: React.ReactNode, valueClassName?: string }) => (
    <div className="flex justify-between items-center text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium text-right", valueClassName)}>{value || 'N/A'}</span>
    </div>
);


export default function DrawdownChart({ data, journal, onClick, showZoomSlider = false, brushY = 275 }: DrawdownChartProps) {
    const [displayMode, setDisplayMode] = React.useState<'amount' | 'percentage'>('amount');
    const uniqueId = React.useMemo(() => `chart-dd-${Math.random().toString(36).substr(2, 9)}`, []);

    const { drawdownData, stats } = React.useMemo(() => {
        if (!data || data.length === 0 || !journal) {
            return { drawdownData: [], stats: { worst: 0, average: 0, current: 0, topToBottom: 0, bottomToTop: 0 } };
        }
        
        let peakBalance = journal.initialDeposit;
        let peakIndex = 0;
        let worstDrawdown = 0;
        let worstDrawdownIndex = -1;
        let peakAtWorstDrawdown = 0;
        let recoveryIndex = -1;
        let drawdowns: number[] = [];

        const ddData = data.map((d, index) => {
            if (d.balance > peakBalance) {
                peakBalance = d.balance;
                peakIndex = index;
            }
            const drawdownValue = d.balance - peakBalance;
            const drawdownPercent = peakBalance > 0 ? (drawdownValue / peakBalance) * 100 : 0;
            
            if(drawdownValue < 0) {
                drawdowns.push(drawdownValue);
            }

            if (drawdownValue < worstDrawdown) {
                worstDrawdown = drawdownValue;
                worstDrawdownIndex = index;
                peakAtWorstDrawdown = peakIndex;
                recoveryIndex = -1; // Reset recovery when a new low is found
            }
            
            // Check for recovery ONLY if we have a worst drawdown
            if (worstDrawdownIndex !== -1 && recoveryIndex === -1 && d.balance >= data[peakAtWorstDrawdown].balance) {
                recoveryIndex = index;
            }
            
            return { ...d, drawdown: drawdownValue, drawdownPercent, peakBalance };
        });

        const topToBottom = worstDrawdownIndex !== -1 ? worstDrawdownIndex - peakAtWorstDrawdown : 0;
        const bottomToTop = recoveryIndex !== -1 && worstDrawdownIndex !== -1 ? recoveryIndex - worstDrawdownIndex : 0;
        const averageDrawdown = drawdowns.length > 0 ? drawdowns.reduce((a,b) => a + b, 0) / drawdowns.length : 0;

        return {
            drawdownData: ddData,
            stats: {
                worst: Math.abs(worstDrawdown),
                average: Math.abs(averageDrawdown),
                current: Math.abs(ddData[ddData.length - 1].drawdown),
                topToBottom,
                bottomToTop,
            }
        };
    }, [data, journal]);
    
    if (!journal) {
        return null;
    }
    
    const yAxisKey = displayMode === 'percentage' ? 'drawdownPercent' : 'drawdown';

    const yAxisTickFormatter = (value: number) => {
        const numValue = Number(value);
        if (displayMode === 'percentage') return `${numValue.toFixed(0)}%`;
        if (Math.abs(numValue) >= 1000000) return `$${(numValue / 1_000_000).toFixed(1)}M`;
        if (Math.abs(numValue) >= 10000) return `$${(numValue / 1_000).toFixed(0)}k`;
        return `$${numValue.toFixed(0)}`;
    };
    
    const maxDrawdownValue = Math.min(...drawdownData.map(d => d[yAxisKey]), 0);
    const yDomain = [maxDrawdownValue * 1.1, 0];


    return (
        <div className="space-y-4">
            <Card className="glassmorphic bg-glass-red">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Drawdown Curve</CardTitle>
                            <CardDescription>
                                Visualizes the decline from a peak in your account balance over the course of your trades.
                            </CardDescription>
                        </div>
                         <div className="w-40 space-y-1">
                            <Label className="text-xs">Display</Label>
                            <Select value={displayMode} onValueChange={(v) => setDisplayMode(v as 'amount' | 'percentage')}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="amount">Return ($)</SelectItem>
                                    <SelectItem value="percentage">Return (%)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={drawdownData}
                                margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                                onClick={onClick}
                                className={onClick ? "cursor-pointer" : ""}
                            >
                                <defs>
                                    <linearGradient id={`areaColorRed-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="hsl(var(--border) / 0.5)"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="trade"
                                    type="number"
                                    domain={["dataMin", "dataMax"]}
                                    tickFormatter={(value) => `${Math.floor(value)}`}
                                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                    axisLine={{ stroke: "hsl(var(--border))" }}
                                    tickLine={{ stroke: "hsl(var(--border))" }}
                                    orientation="bottom"
                                     label={{ value: 'Trades', position: 'insideBottom', offset: -5 }} 
                                />
                                <YAxis
                                    yAxisId="left"
                                    tickFormatter={yAxisTickFormatter}
                                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                    axisLine={{ stroke: "hsl(var(--border))" }}
                                    tickLine={{ stroke: "hsl(var(--border))" }}
                                    domain={yDomain as [number, number]}
                                    allowDataOverflow={true}
                                    orientation="left"
                                    label={{ value: `Drawdown (${displayMode === 'percentage' ? '%' : '$'})`, angle: -90, position: 'insideLeft' }}
                                    reversed={true}
                                />
                                
                                <Tooltip
                                    content={<CustomTooltip displayMode={displayMode} initialDeposit={journal.initialDeposit} />}
                                    cursor={{ stroke: "hsl(var(--foreground))", strokeWidth: 1 }}
                                />
                                
                                <ReferenceLine y={0} yAxisId="left" stroke="hsl(var(--foreground))" strokeDasharray="2 2" strokeWidth={1}/>

                                <Area 
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey={yAxisKey}
                                    name="Drawdown"
                                    stroke="none" 
                                    fill={`url(#areaColorRed-${uniqueId})`}
                                    activeDot={false}
                                />
                                <Line yAxisId="left" type="monotone" dataKey={yAxisKey} stroke="#EF4444" strokeWidth={1.5} activeDot={{ r: 4 }} dot={false} />
                                {showZoomSlider && <Brush dataKey="trade" height={5} stroke="hsl(var(--foreground))" y={brushY} />}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
                        <StatCard label="Worst Drawdown" value={displayMode === 'percentage' ? `${stats.worst.toFixed(2)}` : stats.worst.toFixed(2)} subValue={displayMode === 'percentage' ? '%' : ''} description="Largest peak-to-trough decline" positive={false} />
                        <StatCard label="Average Drawdown" value={displayMode === 'percentage' ? `${stats.average.toFixed(2)}` : stats.average.toFixed(2)} subValue={displayMode === 'percentage' ? '%' : ''} description="Average size of drawdowns" positive={false} />
                        <StatCard label="Current Drawdown" value={displayMode === 'percentage' ? `${stats.current.toFixed(2)}` : stats.current.toFixed(2)} subValue={displayMode === 'percentage' ? '%' : ''} description="Current distance from peak" positive={stats.current === 0} />
                        <StatCard label="Peak to Bottom" value={`${stats.topToBottom}`} subValue=" trades" description="Trades to hit drawdown low" positive={false} />
                        <StatCard label="Recovery Time" value={`${stats.bottomToTop}`} subValue=" trades" description="Trades to recover from low" positive={true} />
                    </div>
                    <div className="mt-4 max-h-60 overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                                <TableRow>
                                    <TableHead>Trade #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Drawdown</TableHead>
                                    <TableHead>Peak Balance</TableHead>
                                    <TableHead>Current Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {drawdownData.map(d => (
                                    <TableRow key={d.trade}>
                                        <TableCell>{d.trade}</TableCell>
                                        <TableCell>{d.tradeObject?.openDate}</TableCell>
                                        <TableCell className="text-red-500"><FormattedNumber value={d.drawdown} /></TableCell>
                                        <TableCell><FormattedNumber value={d.peakBalance} /></TableCell>
                                        <TableCell><FormattedNumber value={d.balance} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <DrawdownCoach journal={journal} drawdownData={drawdownData} />
        </div>
    )
}

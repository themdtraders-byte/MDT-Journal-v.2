

"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import {
  Area,
  ComposedChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  Brush,
  Bar,
  Cell,
} from "recharts"
import { cn } from "@/lib/utils"
import FormattedNumber from "../ui/formatted-number"
import type { Trade, Journal, AppSettings } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Button } from "../ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "../ui/dropdown-menu"
import { useJournalStore } from "@/hooks/use-journal-store"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"

interface EquityCurveChartProps {
  trades: Trade[]
  initialDeposit: number
  onClick?: (data: any) => void
  subCategoryData?: any[] // New prop for the second line
}


const CustomTooltip = ({ active, payload, label, options, initialDeposit, displayMode }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const tradeObject: Trade | null = data.tradeObject;
    if (!tradeObject) return null;
    
    const directionColor = tradeObject?.direction === 'Buy' ? 'bg-green-500' : 'bg-red-500';

    const balanceValue = displayMode === 'R' ? data.rBalance : data.balance;
    const plValue = displayMode === 'R' ? (data.realizedR) : tradeObject.auto.pl;


    return (
      <div className="rounded-md border bg-background/80 backdrop-blur-sm p-1.5 shadow-sm text-[10px] w-48">
        <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1.5">
                <div className={cn("w-2 h-2 rounded-full", directionColor)} />
                <p className="font-bold text-xs">{options.groupByDay ? data.date : `Trade #${data.trade}`}</p>
            </div>
            {tradeObject && <p className="text-muted-foreground text-[9px]">{tradeObject.openDate}</p>}
        </div>
        
        <div className="mt-2 space-y-0.5">
             <DetailItem label="Balance" value={displayMode === 'R' ? `${balanceValue.toFixed(2)}R` : <FormattedNumber value={balanceValue} />} />
             <DetailItem label="P/L" value={displayMode === 'R' ? `${plValue.toFixed(2)}R` : <FormattedNumber value={plValue} />} valueClassName={cn(plValue >= 0 ? 'text-green-500' : 'text-red-500')} />
             {options.showFees && data.balanceWithFees !== undefined && <DetailItem label="Net Balance" value={<FormattedNumber value={data.balanceWithFees} />} />}
             <hr className="border-border/50 my-1"/>
             <DetailItem label="Instrument" value={tradeObject.pair} />
             <DetailItem label="Risk %" value={`${tradeObject.auto.riskPercent.toFixed(2)}%`} />
             <DetailItem label="R:R" value={`${tradeObject.auto.rr.toFixed(2)}`} />
             <DetailItem label="Score" value={tradeObject.auto.score.value.toFixed(0)} />
        </div>
      </div>
    )
  }
  return null
}

const DetailItem = ({ label, value, valueClassName }: { label: string, value: React.ReactNode, valueClassName?: string }) => (
    <div className="flex justify-between items-start text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium text-right", valueClassName)}>{value || 'N/A'}</span>
    </div>
);


export default function EquityCurveChart({
  trades,
  initialDeposit,
  onClick,
  subCategoryData = [],
}: EquityCurveChartProps) {
    const { appSettings } = useJournalStore(state => ({ appSettings: state.appSettings }));
    const [displayMode, setDisplayMode] = useState<'$' | 'R'>('$');
    const [equityOptions, setEquityOptions] = useState({
        showFees: false,
        showTiltmeter: false,
        showMA20: false,
        showMA50: false,
        groupByDay: false,
        showChartZoomSlider: true,
    });
    
    const uniqueId = useMemo(() => `chart-${Math.random().toString(36).substr(2, 9)}`, []);

    const isRMode = displayMode === 'R';

    const { processedData, yAxisDomain, zeroPercent, initialValue } = useMemo(() => {
        if (!trades || trades.length === 0 || !appSettings) {
            return { processedData: [], yAxisDomain: ["auto", "auto"], zeroPercent: 50, initialValue: initialDeposit };
        }
        
        const initialValue = isRMode ? 0 : initialDeposit;
        
        const sortedTrades = [...trades].sort((a, b) => new Date(`${a.openDate}T${a.openTime}`).getTime() - new Date(`${b.openDate}T${b.openTime}`).getTime());
        
        const chartData = equityOptions.groupByDay
            ? Object.values(
                sortedTrades.reduce((acc, trade) => {
                    const date = trade.closeDate;
                    if (!date) return acc;
                    if (!acc[date]) {
                        const prevDay = Object.values(acc).length > 0 ? Object.values(acc)[Object.values(acc).length - 1] : { balance: initialDeposit, balanceWithFees: initialDeposit, rBalance: 0 };
                        acc[date] = { date, trade: Object.values(acc).length + 1, balance: prevDay.balance, balanceWithFees: prevDay.balanceWithFees, rBalance: prevDay.rBalance, realizedR: 0, tiltScore: 0, tradeCount: 0 };
                    }
                    
                    acc[date].balance += trade.auto.pl;
                    acc[date].balanceWithFees += trade.auto.pl - (trade.auto.commissionCost || 0) - (trade.auto.spreadCost || 0);

                    const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
                    const riskPips = trade.stopLoss > 0 ? Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize : 0;
                    const riskAmount = riskPips * trade.lotSize * pairInfo.pipValue;
                    const realizedR = riskAmount > 0 ? trade.auto.pl / riskAmount : 0;
                    
                    acc[date].rBalance += realizedR;
                    acc[date].realizedR += realizedR;
                    acc[date].tiltScore += trade.auto.score.value;
                    acc[date].tradeCount++;
                    acc[date].tradeObject = trade; // Store last trade of day for tooltip context
                    return acc;
                }, {} as Record<string, any>)
            )
            : (() => {
                let cumulativeBalance = initialDeposit;
                let cumulativeBalanceWithFees = initialDeposit;
                let cumulativeRBalance = 0;
                
                return sortedTrades.map((trade, index) => {
                    const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
                    const riskPips = trade.stopLoss > 0 ? Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize : 0;
                    const riskAmount = riskPips * trade.lotSize * pairInfo.pipValue;
                    const realizedR = riskAmount > 0 ? trade.auto.pl / riskAmount : 0;
                    
                    cumulativeBalance += trade.auto.pl;
                    cumulativeBalanceWithFees += trade.auto.pl - (trade.auto.commissionCost || 0) - (trade.auto.spreadCost || 0);
                    cumulativeRBalance += realizedR;
                    
                    return {
                        trade: index + 1,
                        date: trade.closeDate,
                        balance: cumulativeBalance,
                        balanceWithFees: cumulativeBalanceWithFees,
                        rBalance: cumulativeRBalance,
                        realizedR: realizedR,
                        tiltScore: trade.auto.score.value,
                        tradeObject: trade,
                    };
                });
            })();

        let dataWithMA = chartData.map(d => ({ ...d, ma20: null, ma50: null }));
        const yAxisKey = isRMode ? 'rBalance' : 'balance';

        if(equityOptions.showMA20 && dataWithMA.length >= 20) {
            for(let i = 19; i < dataWithMA.length; i++) {
                const sum = dataWithMA.slice(i - 19, i + 1).reduce((acc, curr) => acc + curr[yAxisKey], 0);
                // @ts-ignore
                dataWithMA[i].ma20 = sum / 20;
            }
        }
        if(equityOptions.showMA50 && dataWithMA.length >= 50) {
            for(let i = 49; i < dataWithMA.length; i++) {
                const sum = dataWithMA.slice(i - 49, i + 1).reduce((acc, curr) => acc + curr[yAxisKey], 0);
                // @ts-ignore
                dataWithMA[i].ma50 = sum / 20;
            }
        }

        const dataWithProfitLoss = dataWithMA.map(d => ({
            ...d,
            profit: d[yAxisKey] >= initialValue ? d[yAxisKey] : initialValue,
            loss: d[yAxisKey] < initialValue ? d[yAxisKey] : initialValue,
        }));

        let allValues: (number | null | undefined)[];
        
        if (isRMode) {
            allValues = dataWithProfitLoss.flatMap(d => [d.rBalance, d.ma20, d.ma50]);
            if (subCategoryData.length > 0) {
                 allValues.push(...subCategoryData.map(d => d.rBalance));
            }
        } else {
            allValues = dataWithProfitLoss.flatMap(d => [d.balance, d.balanceWithFees, d.ma20, d.ma50]);
            if(subCategoryData.length > 0) {
                allValues.push(...subCategoryData.map(d => d.balance));
            }
        }

        const filteredValues = allValues.filter(v => typeof v === 'number' && isFinite(v)) as number[];
        const minVal = Math.min(...filteredValues, initialValue);
        const maxVal = Math.max(...filteredValues, initialValue);
        const range = maxVal - minVal;

        const padding = range * 0.1 || (isRMode ? 2 : 100);
        const domain: [number | string, number | string] = [minVal - padding, maxVal + padding];
        
        const totalRange = (domain[1] as number) - (domain[0] as number);
        const zeroPercent = totalRange > 0 ? (1 - (initialValue - (domain[0] as number)) / totalRange) * 100 : 50;

        return { processedData: dataWithProfitLoss, yAxisDomain: domain, zeroPercent, initialValue };
    }, [trades, initialDeposit, displayMode, equityOptions, appSettings, subCategoryData]);
    

    const yAxisTickFormatter = useMemo(() => {
      return (value: number) => {
        if (displayMode === 'R') {
          return `${value.toFixed(1)}R`;
        }
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value);
      }
    }, [displayMode]);
    
    const yAxisKey = displayMode === 'R' ? 'rBalance' : 'balance';

    return (
        <Card className="glassmorphic">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Equity Curve</CardTitle>
                <div className="flex items-center gap-2">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">View Options</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Chart Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={equityOptions.showMA20} onCheckedChange={(c) => setEquityOptions(o => ({...o, showMA20: !!c}))}>Show 20-MA</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={equityOptions.showMA50} onCheckedChange={(c) => setEquityOptions(o => ({...o, showMA50: !!c}))}>Show 50-MA</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={equityOptions.showFees} onCheckedChange={(c) => setEquityOptions(o => ({...o, showFees: !!c}))}>Show Net (After Costs)</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={equityOptions.showTiltmeter} onCheckedChange={(c) => setEquityOptions(o => ({...o, showTiltmeter: !!c}))}>Show Discipline Score</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={equityOptions.groupByDay} onCheckedChange={(c) => setEquityOptions(o => ({...o, groupByDay: !!c}))}>Group by Day</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                    <Select value={displayMode} onValueChange={(v) => setDisplayMode(v as '$' | 'R')}>
                        <SelectTrigger className="w-[80px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="$">$</SelectItem>
                            <SelectItem value="R">R</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                        <ComposedChart
                            data={processedData}
                            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                            onClick={onClick}
                            className={onClick ? "cursor-pointer" : ""}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="hsl(var(--border) / 0.5)"
                                vertical={false}
                            />
                            <XAxis
                                dataKey={equityOptions.groupByDay ? "date" : "trade"}
                                type={equityOptions.groupByDay ? "category" : "number"}
                                domain={["dataMin", "dataMax"]}
                                tickFormatter={(value) => equityOptions.groupByDay ? value : `T${Math.floor(value)}`}
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                                tickLine={{ stroke: "hsl(var(--border))" }}
                            />
                            <YAxis
                                yAxisId="left"
                                tickFormatter={yAxisTickFormatter}
                                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                                tickLine={{ stroke: "hsl(var(--border))" }}
                                domain={yAxisDomain}
                                allowDataOverflow={true}
                            />
                            {equityOptions.showTiltmeter && (
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={[0, 100]}
                                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            )}
                            
                            <Tooltip
                                content={<CustomTooltip options={equityOptions} initialDeposit={initialDeposit} displayMode={displayMode} />}
                                cursor={{ stroke: "hsl(var(--foreground))", strokeWidth: 1 }}
                            />
                            
                            <defs>
                                <linearGradient id={`areaColorGreen-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id={`areaColorRed-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0} />
                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.4} />
                                </linearGradient>
                                <linearGradient id={`splitColor-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop stopColor="#22C55E" offset={`${zeroPercent}%`} />
                                    <stop stopColor="#EF4444" offset={`${zeroPercent}%`} />
                                </linearGradient>
                            </defs>

                            <ReferenceLine y={initialValue} yAxisId="left" stroke="hsl(var(--foreground))" strokeWidth={1} />
                            
                            <Area 
                                yAxisId="left" type="monotone" dataKey="profit" stroke="none" 
                                fill={`url(#areaColorGreen-${uniqueId})`} baseValue={initialValue}
                            />
                            <Area 
                                yAxisId="left" type="monotone" dataKey="loss" stroke="none" 
                                fill={`url(#areaColorRed-${uniqueId})`} baseValue={initialValue}
                            />
                            
                            <Line 
                                yAxisId="left" type="monotone" dataKey={yAxisKey} stroke={`url(#splitColor-${uniqueId})`}
                                strokeWidth={1} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#ffffff' }}
                                name="Gross P/L"
                            />
                            
                            {subCategoryData.length > 0 && (
                                <Line
                                    yAxisId="left" type="monotone" 
                                    data={isRMode ? subCategoryData.map(d => ({ ...d, rBalance: d.rBalance })) : subCategoryData}
                                    dataKey={isRMode ? 'rBalance' : 'balance'}
                                    stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5"
                                    dot={false} name="Sub-category"
                                />
                            )}


                            {equityOptions.showFees && <Line yAxisId="left" type="monotone" dataKey="balanceWithFees" stroke="#f59e0b" strokeWidth={1} dot={false} strokeDasharray="3 3" name="Net P/L (after costs)"/>}
                            
                            {equityOptions.showTiltmeter && !equityOptions.groupByDay && (
                            <Bar yAxisId="right" dataKey="tiltScore" name="Discipline Score" fill="hsl(var(--primary))" opacity={0.2} barSize={10}>
                                {processedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.tradeObject?.auto.score.color || 'hsl(var(--muted))'} />
                                ))}
                            </Bar>
                            )}

                            {equityOptions.showMA20 && <Line yAxisId="left" type="monotone" dataKey="ma20" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="3 3" name="20-MA"/>}
                            {equityOptions.showMA50 && <Line yAxisId="left" type="monotone" dataKey="ma50" stroke="#8b5cf6" strokeWidth={1.5} dot={false} strokeDasharray="5 5" name="50-MA"/>}
                            
                            {equityOptions.showChartZoomSlider && <Brush dataKey={equityOptions.groupByDay ? 'date' : 'trade'} height={15} stroke="hsl(var(--border) / 0.5)" y={330} travellerWidth={10} />}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

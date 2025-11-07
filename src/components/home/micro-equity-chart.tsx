
'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, ReferenceLine, Cell, XAxis, YAxis } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Journal, Trade } from '@/types';
import FormattedNumber from '@/components/ui/formatted-number';
import { TooltipProvider } from '../ui/tooltip';
import TradeDetailDialog from '../trade-detail-dialog';
import { useJournalStore } from '@/hooks/use-journal-store';

const MicroEquityChart = ({ activeJournal, filteredTrades }: { activeJournal: Journal | null, filteredTrades: Trade[] }) => {
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const { appSettings } = useJournalStore();

  const { chartData, totalPl, gainPercentage } = useMemo(() => {
    if (!activeJournal || !filteredTrades || filteredTrades.length === 0 || !appSettings) { 
      return { chartData: [], totalPl: 0, gainPercentage: 0 };
    }

    const { initialDeposit } = activeJournal;
    const sortedTrades = [...filteredTrades].sort((a, b) => {
        const dateA = new Date(`${a.openDate}T${a.openTime || '00:00:00'}`);
        const dateB = new Date(`${b.openDate}T${b.openTime || '00:00:00'}`);
        return dateA.getTime() - dateB.getTime();
    });
    
    const data = sortedTrades.map((trade, index) => ({
      trade: index + 1,
      pl: trade.auto.pl,
      tradeObject: trade
    }));
    
    const calculatedTotalPl = filteredTrades.reduce((sum, t) => sum + t.auto.pl, 0);
    const calculatedGainPercentage = initialDeposit > 0 ? (calculatedTotalPl / initialDeposit) * 100 : 0;
    
    return { chartData: data, totalPl: calculatedTotalPl, gainPercentage: calculatedGainPercentage };
  }, [activeJournal, filteredTrades, appSettings]);

  if (!activeJournal) return null;

  const handleChartClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.tradeObject) {
        setViewingTrade(data.activePayload[0].payload.tradeObject);
    }
  }
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background/80 backdrop-blur-sm p-2 shadow-sm text-xs">
          <p className="font-bold">Trade #{data.trade}</p>
          <p className={cn(data.pl >= 0 ? 'text-green-500' : 'text-red-500')}>
            P/L: <FormattedNumber value={data.pl} />
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Card className="h-full glassmorphic interactive-card w-full flex flex-col p-2">
         <div className="flex justify-between items-start text-xs text-muted-foreground px-1">
          <span>P/L Per Trade</span>
          <div className={cn("flex items-center font-semibold", totalPl >= 0 ? 'text-green-500' : 'text-red-500')}>
            {totalPl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <FormattedNumber value={totalPl} />
            <span className="text-xs ml-1">({gainPercentage.toFixed(1)}%)</span>
          </div>
        </div>
        <CardContent className="flex-1 p-0 mt-1">
          <TooltipProvider>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }} onClick={handleChartClick}>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent) / 0.2)' }} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <Bar dataKey="pl" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pl >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TooltipProvider>
        </CardContent>
      </Card>
      <TradeDetailDialog
        trade={viewingTrade}
        isOpen={!!viewingTrade}
        onOpenChange={(open) => !open && setViewingTrade(null)}
       />
    </>
  );
}

export default MicroEquityChart;

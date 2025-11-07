

'use client';

import { useMemo, useState } from 'react';
import type { Trade, CustomField, AppSettings } from '@/types';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import PerformanceBarChart from './performance-bar-chart';
import { BeakerIcon } from 'lucide-react';
import { calculateGroupMetrics } from '@/lib/analytics';

interface CustomStatsChartProps {
    trades: Trade[];
    activeFieldId: string;
}

const CustomFieldPerformanceChart = ({ field, trades }: { field: CustomField, trades: Trade[] }) => {
    const { appSettings, journals, activeJournalId } = useJournalStore();
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    
    const chartData = useMemo(() => {
        const dataMap: Record<string, Trade[]> = {};
        
        if (field.type !== 'List' && field.type !== 'Button' || !activeJournal || !appSettings) {
            return [];
        }

        trades.forEach(trade => {
            const value = trade.customStats?.[field.id];
            
            if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
                const unspecifiedKey = 'Unspecified';
                if (!dataMap[unspecifiedKey]) dataMap[unspecifiedKey] = [];
                dataMap[unspecifiedKey].push(trade);
            } else {
                const values = Array.isArray(value) ? value : [value];
                values.forEach(v => {
                    if (!dataMap[v]) dataMap[v] = [];
                    dataMap[v].push(trade);
                });
            }
        });

        return Object.entries(dataMap).map(([name, groupTrades]) => {
            if (!appSettings || !activeJournal) {
                // This case should ideally not be hit if the outer check is correct
                return { 
                    name, 
                    profit: 0, loss: 0, trades: 0, winRate: 0, totalR: 0, avgR: 0, profitFactor: 0, totalPl: 0, gainPercent: 0,
                    expectancy: 0, avgPl: 0, avgWin: 0, avgLoss: 0, avgLotSize: 0, maxWinStreak: 0, maxLossStreak: 0, avgDuration: '0m', avgScore: 0,
                    winCount: 0, lossCount: 0, avgWinScore: 0, avgLossScore: 0
                };
            }
            const metrics = calculateGroupMetrics(groupTrades, appSettings, activeJournal.capital);
            return { name, ...metrics };
        });

    }, [field, trades, appSettings, activeJournal]);
    
    if(chartData.length === 0 || (chartData.length === 1 && chartData[0].name === 'Unspecified')) {
        return (
            <Card className="glassmorphic">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BeakerIcon className="text-primary"/>
                        {field.title} Analysis
                    </CardTitle>
                </CardHeader>
                 <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                    <p>Not enough trades with '{field.title}' data to generate a chart.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <PerformanceBarChart title={`${field.title} Analysis`} data={chartData} />
    );
};


export default function CustomStatsChart({ trades, activeFieldId }: CustomStatsChartProps) {
    const { appSettings } = useJournalStore(state => state);

    const chartableCustomFields = useMemo(() => {
        if (!appSettings?.customFields) return [];
        return appSettings.customFields.filter(f => f.type === 'List' || f.type === 'Button');
    }, [appSettings?.customFields]);

    if (chartableCustomFields.length === 0) {
        return (
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BeakerIcon className="text-primary"/>
                        Custom Statistics Analyzer
                    </CardTitle>
                    <CardDescription>Create your own data points to analyze their impact on performance.</CardDescription>
                </CardHeader>
                 <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                    <p>No list-based or button-based custom fields defined. Go to Settings -> App Manager to create one!</p>
                </CardContent>
            </Card>
        );
    }
    
    const activeField = chartableCustomFields.find(f => f.id === activeFieldId);

    return (
        <div className="space-y-4">
            {activeField ? (
                <CustomFieldPerformanceChart field={activeField} trades={trades} />
            ) : (
                <Card className="glassmorphic">
                    <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                        <p>Select a custom field to view its performance chart.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

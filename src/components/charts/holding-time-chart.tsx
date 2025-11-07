

'use client';

import { useMemo, useState } from 'react';
import type { Trade, AppSettings } from '@/types';
import { useJournalStore } from '@/hooks/use-journal-store';
import PerformanceBarChart from './performance-bar-chart';
import HoldingTimeCoach from './holding-time-coach';
import { calculateGroupMetrics } from '@/lib/analytics';

const HoldingTimeChart = ({ trades, showZoomSlider }: { trades: Trade[], showZoomSlider?: boolean }) => {
    const { appSettings, activeJournalId, journals } = useJournalStore();
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    
    const chartData = useMemo(() => {
        if (!appSettings || !activeJournal) return [];
        
        const bucketConfig = [
            { name: '0-15m', maxMinutes: 15 },
            { name: '15-30m', maxMinutes: 30 },
            { name: '30-60m', maxMinutes: 60 },
            { name: '1-2h', maxMinutes: 120 },
            { name: '2-4h', maxMinutes: 240 },
            { name: '4-8h', maxMinutes: 480 },
            { name: '8h+', maxMinutes: Infinity },
        ];
        
        const buckets = bucketConfig.reduce((acc, bucket) => {
            acc[bucket.name] = [];
            return acc;
        }, {} as Record<string, Trade[]>);

        trades.forEach(trade => {
            const duration = trade.auto.durationMinutes;
            const bucket = bucketConfig.find(b => duration < b.maxMinutes);
            if (bucket) {
                buckets[bucket.name].push(trade);
            }
        });

        return bucketConfig.map(bucket => {
            const groupTrades = buckets[bucket.name];
            const metrics = calculateGroupMetrics(groupTrades, appSettings, activeJournal.capital);
            return { name: bucket.name, ...metrics };
        });

    }, [trades, appSettings, activeJournal]);

    return (
        <PerformanceBarChart
            title="Performance by Holding Time"
            description="Analyzes profitability based on how long trades are held, helping identify your optimal trade duration."
            data={chartData}
            showZoomSlider={showZoomSlider}
        >
            <HoldingTimeCoach data={chartData} />
        </PerformanceBarChart>
    );
};

export default HoldingTimeChart;

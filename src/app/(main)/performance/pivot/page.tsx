
'use client';

import CustomReportBuilder from '@/components/custom-report-builder';
import { useJournalStore } from '@/hooks/use-journal-store';
import { useMemo } from 'react';

export default function PivotPage() {
    const { filters, activeJournalId, journals, appSettings } = useJournalStore(state => ({
        filters: state.filters,
        activeJournalId: state.activeJournalId,
        journals: state.journals,
        appSettings: state.appSettings
    }));
    
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    
    const filteredTrades = useMemo(() => {
        if (!activeJournal) return [];
        const allTrades = activeJournal.trades || [];

        if (!filters || Object.values(filters).every(v => !v || (Array.isArray(v) && v.length === 0))) {
            return allTrades;
        }
        return allTrades.filter(trade => {
            if (filters.pair && filters.pair.length > 0 && !filters.pair.includes(trade.pair)) {
                return false;
            }
             if (filters.direction && filters.direction.length > 0 && !filters.direction.includes(trade.direction)) {
                return false;
            }
            return true;
        });
    }, [activeJournal, filters]);

    if (!activeJournal) return null;

    return (
        <div className="space-y-6">
             <h1 className="text-lg font-semibold">Find Your Edge</h1>
            <CustomReportBuilder trades={filteredTrades} />
        </div>
    );
}


'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { useJournalStore } from '@/hooks/use-journal-store';
import type { Trade, AnalysisCategory } from '@/types';
import TablePage from '@/components/data/table/page';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getCriterionValue } from '@/components/custom-report-builder';

function FilteredView() {
    const searchParams = useSearchParams();
    const { allTrades, appSettings } = useJournalStore(state => ({
        allTrades: state.journals.find(j => j.id === state.activeJournalId)?.trades || [],
        appSettings: state.appSettings,
    }));

    const title = searchParams.get('title') || 'Filtered View';
    const criteriaString = searchParams.get('criteria');
    const criteria: { key: string, value: string }[] = criteriaString ? JSON.parse(criteriaString) : [];

    const filteredTrades = useMemo(() => {
        if (!criteria || criteria.length === 0) {
            return allTrades;
        }

        const analysisConfigs = appSettings.analysisConfigurations || [];

        return allTrades.filter(trade => {
            return criteria.every(criterion => {
                const tradeValue = getCriterionValue(trade, criterion.key, analysisConfigs, appSettings);
                if (Array.isArray(tradeValue)) {
                    return tradeValue.includes(criterion.value);
                }
                return tradeValue === criterion.value;
            });
        });
    }, [allTrades, criteria, appSettings]);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>
                        Displaying {filteredTrades.length} trades matching the selected criteria.
                    </CardDescription>
                </CardHeader>
            </Card>
            <div className="h-[75vh]">
                <TablePage trades={filteredTrades} />
            </div>
        </div>
    );
}


export default function FilteredDataViewPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <FilteredView />
        </Suspense>
    )
}

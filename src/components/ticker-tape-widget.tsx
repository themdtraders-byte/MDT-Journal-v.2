
'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useJournalStore } from '@/hooks/use-journal-store';
import { tradingViewSymbolMap } from '@/lib/data';

const TickerTapeWidget = () => {
    const { theme } = useTheme();
    const { journals, activeJournalId } = useJournalStore();
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    const widgetRef = useRef<HTMLDivElement>(null);

    const symbols = useMemo(() => {
        if (!activeJournal || !activeJournal.plan || !activeJournal.plan.instruments) {
            return [];
        }
        return activeJournal.plan.instruments
            .map(instrument => tradingViewSymbolMap[instrument])
            .filter(Boolean); // Filter out any instruments not in our map
    }, [activeJournal]);

    useEffect(() => {
        if (!widgetRef.current || symbols.length === 0) return;

        const config = {
            "symbols": symbols,
            "showSymbolLogo": true,
            "isTransparent": false,
            "displayMode": "regular",
            "locale": "en",
            "colorTheme": theme === 'light' ? 'light' : 'dark',
        };

        widgetRef.current.innerHTML = ''; // Clear previous widget
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
        script.async = true;
        script.innerHTML = JSON.stringify(config);
        widgetRef.current.appendChild(script);

    }, [theme, symbols]);

    if (symbols.length === 0) {
        return (
            <div className="text-center text-xs text-muted-foreground p-2 bg-muted/50 rounded-md">
                No instruments selected in your trading plan to display in the ticker.
            </div>
        )
    }

    return (
        <div className="tradingview-widget-container mb-4">
            <div ref={widgetRef} className="tradingview-widget-container__widget" />
        </div>
    );
};

export default TickerTapeWidget;


'use client';

import { ThemeProvider, useTheme } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import CustomCursor from '@/components/custom-cursor';
import React, { useState, useEffect, useMemo } from 'react';
import { useJournalStore } from '@/hooks/use-journal-store';
import { inter, robotoMono } from './fonts';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import type { VisualSettings } from '@/types';


const ThemeManager = () => {
    const activeJournal = useJournalStore(state => state.journals.find(j => j.id === state.activeJournalId));
    const visualSettings = activeJournal?.visualSettings;
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        if (!visualSettings) return; 

        const isAccessibilityMode = visualSettings.accessibilityMode;
        if (isAccessibilityMode) {
            document.body.classList.add('accessibility-mode');
            if (theme !== 'light' && theme !== 'dark') {
                setTheme('dark');
            }
        } else {
            document.body.classList.remove('accessibility-mode');
        }

        const root = document.documentElement;
        const newBaseSize = 16 * ((visualSettings.uiScale || 100) / 100);
        root.style.setProperty('--font-size-base', `${newBaseSize}px`);

        const fontVar = getComputedStyle(root).getPropertyValue(visualSettings.fontFamily || '--font-body').trim();
        root.style.setProperty('--font-family', fontVar || 'PT Sans, sans-serif');

        root.style.setProperty('--line-height', String(visualSettings.lineHeight));
        root.style.setProperty('--letter-spacing', `${visualSettings.letterSpacing}em`);
        
        document.body.classList.remove('layout-mobile', 'layout-mac');
        if (visualSettings.dashboardLayout === 'mobile') {
            document.body.classList.add('layout-mobile');
        } else if (visualSettings.dashboardLayout === 'mac') {
            document.body.classList.add('layout-mac');
        }

    }, [visualSettings, theme, setTheme]);
    
    return null;
}

const CustomCursorManager = () => {
    const useCustomCursor = useJournalStore(state => state.journals.find(j => j.id === state.activeJournalId)?.visualSettings?.useCustomCursor ?? false);
    
    if (!useCustomCursor) {
        return null;
    }
    
    return <CustomCursor />;
};


export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        document.title = 'MD Journal by The MD Traders';
    }, []);

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
        >
            <FirebaseClientProvider className={cn(inter.variable, robotoMono.variable)}>
                 {children}
                 <Toaster />
            </FirebaseClientProvider>
        </ThemeProvider>
    );
}

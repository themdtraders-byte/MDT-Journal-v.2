

'use client';

import { useEffect, useMemo } from 'react';
import { useJournalStore } from './use-journal-store';
import type { VisualSettings } from '@/types';

export const useVisualSettings = () => {
    const { visualSettings, updateVisualSettings } = useJournalStore(state => ({
        visualSettings: state.journals.find(j => j.id === state.activeJournalId)?.visualSettings,
        updateVisualSettings: state.updateVisualSettings,
    }));
    
    const isAccessibilityMode = useMemo(() => visualSettings?.accessibilityMode, [visualSettings?.accessibilityMode]);
    const uiScale = visualSettings?.uiScale;
    const fontFamily = visualSettings?.fontFamily;
    const lineHeight = visualSettings?.lineHeight;
    const letterSpacing = visualSettings?.letterSpacing;
    const layout = visualSettings?.dashboardLayout;

    useEffect(() => {
        if (!visualSettings) return;

        const root = document.documentElement;
        
        // Apply UI Scale
        const newBaseSize = 16 * ((uiScale || 100) / 100);
        root.style.setProperty('--font-size-base', `${newBaseSize}px`);

        // Apply font settings from class name
        const fontVar = getComputedStyle(root).getPropertyValue(fontFamily || '--font-body').trim();
        root.style.setProperty('--font-family', fontVar || 'PT Sans, sans-serif');

        // Apply text tuning
        root.style.setProperty('--line-height', String(lineHeight));
        root.style.setProperty('--letter-spacing', `${letterSpacing}em`);

        // Apply layout mode classes to the BODY element
        document.body.classList.remove('layout-mobile', 'layout-mac');
        if (layout === 'mobile') {
            document.body.classList.add('layout-mobile');
        } else if (layout === 'mac') {
            document.body.classList.add('layout-mac');
        }

    }, [uiScale, fontFamily, lineHeight, letterSpacing, layout, visualSettings]);
    
    const setAccessibilityMode = (enabled: boolean) => {
        if (updateVisualSettings) {
            updateVisualSettings({ accessibilityMode: enabled });
        }
    };

    return { visualSettings, isAccessibilityMode, setAccessibilityMode };
};


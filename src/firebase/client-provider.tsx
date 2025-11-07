
'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { useJournalStore } from '@/hooks/use-journal-store';
import { useTheme } from 'next-themes';
import CustomCursor from '@/components/custom-cursor';
import { cn } from '@/lib/utils';
import { inter, robotoMono } from '@/app/fonts';


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


interface FirebaseClientProviderProps {
  children: ReactNode;
  className?: string;
}

export function FirebaseClientProvider({ children, className }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div className={className}>
      <FirebaseProvider
        firebaseApp={firebaseServices.firebaseApp}
        auth={firebaseServices.auth}
        firestore={firebaseServices.firestore}
      >
        <ThemeManager />
        <CustomCursorManager />
        {children}
      </FirebaseProvider>
    </div>
  );
}

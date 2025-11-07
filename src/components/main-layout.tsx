
'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useJournalStore } from '@/hooks/use-journal-store';
import { useHasHydrated } from '@/hooks/use-has-hydrated';
import { useRouter } from 'next/navigation';
import MainHeader from '@/components/main-header';
import MainFooter from '@/components/main-footer';
import { LoadingLogo } from '@/components/LoadingLogo';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import MainSidebar from '@/app/(main)/main-sidebar';
import type { Journal } from '@/types';
import { useSidebar } from './ui/sidebar';

const FloatingCalculator = dynamic(() => import('@/components/floating-calculator'));
const SettingsDialog = dynamic(() => import('@/components/settings-dialog'));
const TrashDialog = dynamic(() => import('@/components/trash-dialog'));
const AccountDialog = dynamic(() => import('@/components/account-dialog'));
const GlobalFilterDialog = dynamic(() => import('@/components/global-filter-dialog'));
const JournalActionsDialog = dynamic(() => import('@/components/journal-actions-dialog'));
const NotificationsDialog = dynamic(() => import('@/components/notifications-dialog'));
const AuditDialog = dynamic(() => import('@/components/audit-dialog'));
const FloatingChecklistDialog = dynamic(() => import('@/components/floating-checklist-dialog'));


// Create a context to pass down settings state setters
const MainLayoutContext = React.createContext<{
    setIsSettingsOpen: (open: boolean) => void;
    setIsTrashOpen: (open: boolean) => void;
}>({
    setIsSettingsOpen: () => {},
    setIsTrashOpen: () => {},
});

const useMainLayoutContext = () => React.useContext(MainLayoutContext);

// This new component will be rendered inside the provider context
const AppShortcuts = () => {
    const { 
        setAccountOpen, 
        setFilterOpen, 
        setJournalActionsOpen,
    } = useJournalStore();
    const { setIsSettingsOpen } = useMainLayoutContext();
    
    useKeyboardShortcuts({
        setAccountOpen,
        setFilterOpen,
        setIsSettingsOpen,
        setJournalActionsOpen,
    });
    return null;
}


export default function MainLayoutContent({ children }: { children: React.ReactNode; }) {
    const hasHydrated = useHasHydrated();
    const router = useRouter();
    
    const { 
        isAccountOpen, setAccountOpen, 
        isFilterOpen, setFilterOpen,
        isAuditOpen, setIsAuditOpen,
        isJournalActionsOpen, setJournalActionsOpen,
        isNotificationsOpen, setNotificationsOpen,
        journals, activeJournalId
    } = useJournalStore();
    
    const activeJournal = useMemo(() => {
      if (!hasHydrated) return null;
      return journals.find(j => j.id === activeJournalId);
    }, [journals, activeJournalId, hasHydrated]);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isTrashOpen, setIsTrashOpen] = useState(false);
    
    const layoutContextValue = { setIsSettingsOpen, setIsTrashOpen };

    if (!hasHydrated || !activeJournal) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-black">
                <LoadingLogo />
            </div>
        );
    }
    
    return (
        <MainLayoutContext.Provider value={layoutContextValue}>
            <div className="flex h-screen w-full">
                <MainSidebar 
                  onSettingsClick={() => setIsSettingsOpen(true)}
                  onTrashClick={() => setIsTrashOpen(true)}
                />
                <div className="flex flex-1 flex-col ml-[var(--sidebar-width-icon)]" style={{'--min-content-width': '1100px'} as React.CSSProperties}>
                    <div className="relative flex flex-col h-full w-full bg-background/95 overflow-x-auto">
                        <header className="sticky top-0 z-20 w-full min-w-[var(--min-content-width)]">
                            <MainHeader />
                        </header>
                        <div className="flex-1 overflow-y-auto">
                            <main className="p-2 md:p-4 lg:p-6 text-sm min-w-[var(--min-content-width)]">
                                {children}
                            </main>
                        </div>
                        <footer className="sticky bottom-0 z-10 w-full min-w-[var(--min-content-width)]">
                            <MainFooter />
                        </footer>

                        {/* AppShortcuts is now safely inside the context provider */}
                        <AppShortcuts />

                        {/* Global Dialogs that are always available */}
                        <FloatingCalculator />
                        <FloatingChecklistDialog />
                        <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
                        <TrashDialog open={isTrashOpen} onOpenChange={setIsTrashOpen} />
                        <AccountDialog open={isAccountOpen} onOpenChange={setAccountOpen} />
                        {activeJournal && (
                            <>
                                <JournalActionsDialog open={isJournalActionsOpen} onOpenChange={setJournalActionsOpen} />
                                <NotificationsDialog open={isNotificationsOpen} onOpenChange={setNotificationsOpen} />
                                <AuditDialog open={isAuditOpen} onOpenChange={setIsAuditOpen} />
                            </>
                        )}
                        <GlobalFilterDialog open={isFilterOpen} onOpenChange={setFilterOpen} />
                    </div>
                </div>
            </div>
        </MainLayoutContext.Provider>
    )
}

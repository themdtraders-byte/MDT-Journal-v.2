

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useJournalStore } from './use-journal-store';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';

type ShortcutActions = {
    setFilterOpen: (open: boolean) => void;
    setIsSettingsOpen: (open: boolean) => void;
    setAccountOpen: (open: boolean) => void;
    setJournalActionsOpen: (open: boolean) => void;
};


export const useKeyboardShortcuts = (actions: ShortcutActions) => {
  const store = useJournalStore(state => ({
    shortcuts: state.appSettings.shortcuts || [],
    isAddTradeDialogOpen: state.isAddTradeDialogOpen,
    toggleCalculator: state.toggleCalculator,
    toggleChecklist: state.toggleChecklist,
  }));
  
  // Use a ref to hold the store state to ensure the event listener always has the latest version
  const storeRef = useRef(store);
  storeRef.current = store;

  const router = useRouter();
  const { toggleSidebar } = useSidebar();


  const handleShortcut = useCallback((action: string) => {
    // Access the latest state via the ref inside the callback
    const currentStore = storeRef.current;
    switch(action) {
        case 'Add New Trade':
            router.push('/add-trade');
            break;
        case 'Toggle Sidebar':
            toggleSidebar();
            break;
        case 'Toggle Calculator':
            currentStore.toggleCalculator();
            break;
        case 'Toggle Checklist':
            currentStore.toggleChecklist();
            break;
        case 'Open Account Management':
            actions.setAccountOpen(true);
            break;
        case 'Open Global Filter':
            actions.setFilterOpen(true);
            break;
        case 'Open Settings':
            actions.setIsSettingsOpen(true);
            break;
        case 'Open Gamification Center':
            router.push('/gamification');
            break;
        case 'Open Journal Actions':
            actions.setJournalActionsOpen(true);
            break;
        case 'Navigate to Home':
            router.push('/home');
            break;
        case 'Navigate to Charts':
            router.push('/performance/chart');
            break;
        default:
            break;
    }
  }, [router, toggleSidebar, actions]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
        return;
      }
      
      const { shortcuts } = storeRef.current;

      shortcuts.forEach(shortcut => {
        const requiredKeys = new Set(shortcut.keys.map(k => k.toLowerCase()));
        
        const altRequired = requiredKeys.has('alt');
        const ctrlRequired = requiredKeys.has('ctrl');
        const shiftRequired = requiredKeys.has('shift');
        const metaRequired = requiredKeys.has('meta');

        const mainKey = Array.from(requiredKeys).find(k => !['alt', 'ctrl', 'shift', 'meta'].includes(k));

        if (!mainKey || event.key.toLowerCase() !== mainKey) {
            return;
        }

        if (
          altRequired === event.altKey &&
          ctrlRequired === event.ctrlKey &&
          shiftRequired === event.shiftKey &&
          metaRequired === event.metaKey
        ) {
          event.preventDefault();
          handleShortcut(shortcut.action);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleShortcut]); // The dependency array is now stable
};


'use client';

import { useJournalStore } from './use-journal-store';

/**
 * A hook to centralize application-level actions and state.
 * This can be expanded to include other global functionalities.
 */
export const useApp = () => {
  const { importTradesBatch, activeJournal } = useJournalStore();

  return {
    importTradesBatch,
    selectedAccount: activeJournal,
    // Other app-wide actions can be added here
  };
};

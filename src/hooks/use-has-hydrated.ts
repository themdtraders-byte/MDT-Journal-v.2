
'use client';

import { useState, useEffect } from 'react';
import { useJournalStore } from './use-journal-store';

/**
 * A hook to reliably determine if the Zustand store has been rehydrated.
 * This is the definitive gatekeeper to prevent server-side rendering crashes
 * on components that depend on store data.
 */
export const useHasHydrated = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Zustand's `onHasHydrated` is an internal and undocumented API.
    // A more robust way is to use `onFinishHydration` or check a custom state flag.
    // Here, we'll check a flag that we set ourselves in the store.
    const unsubFinishHydration = useJournalStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Also check the state directly in case hydration is already finished
    // by the time this component mounts.
    if (useJournalStore.persist.hasHydrated()) {
        setHydrated(true);
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
};

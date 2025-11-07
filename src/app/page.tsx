
'use client';

import { useEffect, useState } from 'react';
import SplashScreen from '@/components/splash-screen';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useJournalStore } from '@/hooks/use-journal-store';
import { useHasHydrated } from '@/hooks/use-has-hydrated';

export default function Home() {
  const hasHydrated = useHasHydrated();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const { setUser, loadFromFirestore, journals, activeJournalId, isLoading } = useJournalStore(state => ({
    setUser: state.setUser,
    loadFromFirestore: state.loadFromFirestore,
    journals: state.journals,
    activeJournalId: state.activeJournalId,
    isLoading: state.isLoading,
  }));

  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    // This effect now manages the entire startup flow.

    // 1. Wait for Zustand to hydrate from localStorage and for Firebase to check the user.
    if (!hasHydrated || isUserLoading) {
      return; // Do nothing until both are ready.
    }

    // 2. Once ready, check user status.
    if (user) {
      // User is logged in (either guest or real). Update the store.
      setUser(user);
      if (!user.isAnonymous) {
        // If it's a real user, trigger Firestore load.
        // The store's internal state will handle the loading flag.
        loadFromFirestore();
      }

      // 3. Determine where to navigate.
      const activeJournal = journals.find(j => j.id === activeJournalId);
      if (activeJournalId && activeJournal) {
        // If an active journal exists, go to the dashboard.
        router.replace('/home');
      } else {
        // Otherwise, go to the journal selection screen.
        router.replace('/selector');
      }
    } else {
      // No user found, redirect to the login page.
      router.replace('/login');
    }
    
    // Once we've made a routing decision, we can consider the app "loaded".
    setIsAppLoading(false);

  }, [hasHydrated, isUserLoading, user, journals, activeJournalId, router, setUser, loadFromFirestore]);

  // Only show the splash screen while the initial checks are running.
  if (isAppLoading) {
    return <SplashScreen />;
  }

  // Render nothing once the initial load and redirect have been triggered.
  return null;
}

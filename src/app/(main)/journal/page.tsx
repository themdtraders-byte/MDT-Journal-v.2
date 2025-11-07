

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useJournalStore } from '@/hooks/use-journal-store';

// This page has been removed as the dialog is now opened directly.
// This component will redirect to the home page if accessed directly.
export default function JournalPageRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to a more appropriate page, like home.
        const { setJournalActionsOpen } = useJournalStore.getState();
        setJournalActionsOpen(true);
        router.replace('/home');
    }, [router]);

    return null; // Render nothing while redirecting
}

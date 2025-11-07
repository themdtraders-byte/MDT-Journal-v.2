
'use client';

import { useEffect } from 'react';
import { useJournalStore } from '@/hooks/use-journal-store';

export default function StepsPage() {
    const { setExecutionChecklistOpen } = useJournalStore(state => ({
        setExecutionChecklistOpen: state.setExecutionChecklistOpen,
    }));

    useEffect(() => {
        setExecutionChecklistOpen(true);
    }, [setExecutionChecklistOpen]);

    // This component renders nothing itself, as the dialog is handled globally.
    return null;
}

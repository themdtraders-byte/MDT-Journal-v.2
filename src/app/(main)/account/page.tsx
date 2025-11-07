
'use client';

import AccountDialog from '@/components/account-dialog';
import { useJournalStore } from '@/hooks/use-journal-store';

export default function AccountPage() {
    const { isAccountOpen, setAccountOpen } = useJournalStore(state => ({
        isAccountOpen: state.isAccountOpen,
        setAccountOpen: state.setAccountOpen,
    }));
    
    // This page component now just renders the profile dialog.
    return <AccountDialog open={isAccountOpen} onOpenChange={setAccountOpen} />;
}

'use client';

import JournalSelector from '@/components/journal-selector';
import { useHasHydrated } from '@/hooks/use-has-hydrated';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingLogo } from '@/components/LoadingLogo';

export default function SelectorPage() {
    const hasHydrated = useHasHydrated();
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (hasHydrated && !isUserLoading && !user) {
            router.replace('/login');
        }
    }, [hasHydrated, isUserLoading, user, router]);

    if (!hasHydrated || isUserLoading) {
         return (
            <div className="flex h-screen w-screen items-center justify-center bg-black">
                <LoadingLogo />
            </div>
        );
    }
    
    if (!user) {
        // This state should be brief due to the useEffect, but it's a good fallback.
        return (
             <div className="flex h-screen w-screen items-center justify-center bg-black">
                <LoadingLogo />
            </div>
        );
    }

    return <JournalSelector />;
}

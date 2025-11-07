
'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page redirects to the default 'analytics' tab.
export default function PerformancePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/performance/analytics');
  }, [router]);

  return null;
}

'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page redirects to the default 'plan' tab.
export default function PlansPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/plans/plan');
  }, [router]);

  return null;
}

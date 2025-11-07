
'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function PerformanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
          {children}
      </div>
    </div>
  );
}

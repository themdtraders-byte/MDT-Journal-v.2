
'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, usePathname } from 'next/navigation';

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = (value: string) => {
    router.push(`/plans/${value}`);
  };
  
  const activeTab = pathname.split('/')[2] || 'plan';

  return (
    <div className="space-y-6 h-full flex flex-col">
      <h1 className="text-xl font-bold">Build Up</h1>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plan">Trading Plan</TabsTrigger>
          <TabsTrigger value="strategy">Strategy Builder</TabsTrigger>
          <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
        </TabsList>
        <div className="flex-1 mt-4 overflow-y-auto">
          {children}
        </div>
      </Tabs>
    </div>
  );
}

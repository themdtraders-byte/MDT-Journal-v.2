

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Trade Calendar</h1>
      <Card className="glassmorphic">
        <CardHeader>
          <CardTitle className="text-base">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The trade calendar view will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

    

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MissedTradesPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-lg font-semibold">Missed Trades Analysis</h1>
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="text-base">Feature Removed</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The Missed Trades feature has been temporarily removed due to a persistent bug. It will be re-introduced in a future update.</p>
                </CardContent>
            </Card>
        </div>
    );
}

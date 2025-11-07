
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LeaderboardPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold">Leaderboard</h1>
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle>Leaderboard Moved</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The Leaderboard has been moved to the Gamification Center, accessible via the Trophy icon in the header.</p>
                </CardContent>
            </Card>
        </div>
    );
}

    

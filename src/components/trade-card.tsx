
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trade } from "@/types";
import { format } from "date-fns";
import Image from "next/image";
import FormattedNumber from "./ui/formatted-number";
import { cn } from "@/lib/utils";
import PairIcon from "./PairIcon";

interface TradeCardProps extends React.HTMLAttributes<HTMLDivElement> {
    trade: Trade;
}

export default function TradeCard({ trade, ...props }: TradeCardProps) {

    const primaryImage = useMemo(() => {
        if (trade.imagesByTimeframe) {
            const sortedTimeframes = Object.keys(trade.imagesByTimeframe).sort((a,b) => {
                 const timeA = parseInt(a.replace(/[^0-9]/g, ''));
                 const timeB = parseInt(b.replace(/[^0-9]/g, ''));
                 if (a.includes('h')) return timeA * 60 - timeB;
                 if (b.includes('h')) return timeA - timeB * 60;
                 return timeA - timeB;
            });
            for (const tf of sortedTimeframes) {
                if (trade.imagesByTimeframe[tf] && trade.imagesByTimeframe[tf].length > 0) {
                    return trade.imagesByTimeframe[tf][0];
                }
            }
        }
        if (trade.images && trade.images.length > 0) {
            return trade.images[0];
        }
        return null;
    }, [trade.images, trade.imagesByTimeframe]);

    const outcomeColor = trade.auto.outcome === 'Win' ? 'text-green-500' : trade.auto.outcome === 'Loss' ? 'text-red-500' : 'text-muted-foreground';

    return (
        <Card className="glassmorphic interactive-card flex flex-col h-full overflow-hidden" {...props}>
            <div className="relative aspect-[4/3] bg-muted/30">
                {primaryImage ? (
                    <Image src={primaryImage} alt={`Trade on ${trade.pair}`} fill className="object-cover"/>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                        No Image
                    </div>
                )}
            </div>
            <CardHeader className="p-2 flex-row items-start justify-between">
                <div className="flex items-center gap-2">
                    <PairIcon pair={trade.pair} />
                    <div>
                         <CardTitle className="text-sm font-bold">{trade.pair}</CardTitle>
                        <p className="text-xs text-muted-foreground">{format(new Date(trade.openDate + 'T' + trade.openTime), 'dd/MM/yy, p')}</p>
                    </div>
                </div>
                 <div className={cn("text-right", outcomeColor)}>
                    <p className="font-bold text-base"><FormattedNumber value={trade.auto.pl} /></p>
                    <p className="text-xs">{trade.auto.pips.toFixed(1)} Pips</p>
                </div>
            </CardHeader>
            <CardFooter className="p-2 pt-0 mt-auto flex justify-between items-center text-xs text-muted-foreground">
                <span>{trade.auto.session}</span>
                <span>{trade.auto.rr.toFixed(1)}R</span>
                 <Badge variant={trade.auto.outcome === 'Win' ? 'default' : 'destructive'} className={cn(
                     trade.auto.outcome === 'Win' && 'bg-green-500/20 text-green-500',
                     trade.auto.outcome === 'Loss' && 'bg-red-500/20 text-red-500'
                 )}>
                    {trade.auto.outcome}
                 </Badge>
            </CardFooter>
        </Card>
    );
}

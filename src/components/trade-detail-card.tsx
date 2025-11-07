import type { Trade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableRow } from './ui/table';
import { cn } from '@/lib/utils';

interface TradeDetailCardProps {
  title: string;
  trade: Trade | null;
}

const TradeDetailCard = ({ title, trade }: TradeDetailCardProps) => {
  if (!trade) {
    return (
      <Card className="glassmorphic h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">No trade data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glassmorphic h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium text-xs">Pair</TableCell>
              <TableCell className="text-xs">{trade.pair}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-xs">Direction</TableCell>
              <TableCell className={cn("text-xs font-semibold", trade.direction === 'Buy' ? 'text-green-500' : 'text-red-500')}>{trade.direction}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-xs">P/L ($)</TableCell>
              <TableCell className={cn("text-xs font-semibold", trade.auto.pl >= 0 ? 'text-green-500' : 'text-red-500')}>
                {trade.auto.pl.toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-xs">R:R</TableCell>
              <TableCell className="text-xs">{trade.auto.rr.toFixed(2)}</TableCell>
            </TableRow>
             <TableRow>
              <TableCell className="font-medium text-xs">Score</TableCell>
              <TableCell className="text-xs">{trade.auto.score?.value || 'N/A'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-xs">Duration</TableCell>
              <TableCell className="text-xs">{trade.auto.holdingTime}</TableCell>
            </TableRow>
             <TableRow>
              <TableCell className="font-medium text-xs">Open Date</TableCell>
              <TableCell className="text-xs">{trade.openDate}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TradeDetailCard;

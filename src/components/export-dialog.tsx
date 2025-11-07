
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Trade } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trades: Trade[]; // All currently filtered trades
  selectedTrades: Trade[];
}

export default function ExportDialog({ open, onOpenChange, trades, selectedTrades }: ExportDialogProps) {
  const [exportOption, setExportOption] = useState<'all' | 'selected' | 'range'>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date, to?: Date }>({});
  const { toast } = useToast();

  const handleExport = () => {
    let tradesToExport: Trade[] = [];

    switch (exportOption) {
        case 'all':
            tradesToExport = trades;
            break;
        case 'selected':
            tradesToExport = selectedTrades;
            break;
        case 'range':
            tradesToExport = trades.filter(trade => {
                const tradeDate = new Date(trade.openDate);
                const fromMatch = !dateRange.from || tradeDate >= dateRange.from;
                const toMatch = !dateRange.to || tradeDate <= dateRange.to;
                return fromMatch && toMatch;
            });
            break;
    }

    if (tradesToExport.length === 0) {
        toast({
            title: "No Trades to Export",
            description: "Your selection resulted in zero trades. Please adjust your filters or selection.",
            variant: "destructive",
        });
        return;
    }

    const dataStr = JSON.stringify(tradesToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `MD_Journal_Trades_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({ title: "Export Successful", description: `${tradesToExport.length} trades have been exported.`});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphic">
        <DialogHeader>
          <DialogTitle>Export Trades</DialogTitle>
          <DialogDescription>
            Choose which trades you'd like to export to a JSON file.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <RadioGroup value={exportOption} onValueChange={(v) => setExportOption(v as any)}>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all">Export all filtered trades ({trades.length})</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="selected" id="selected" disabled={selectedTrades.length === 0} />
                    <Label htmlFor="selected" className={cn(selectedTrades.length === 0 && 'text-muted-foreground')}>Export selected trades ({selectedTrades.length})</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="range" id="range" />
                    <Label htmlFor="range">Export by date range</Label>
                </div>
            </RadioGroup>
            {exportOption === 'range' && (
                <div className="pl-6 mt-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

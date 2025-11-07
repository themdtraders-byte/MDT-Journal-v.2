
"use client"
import React, { useState, useMemo, useEffect } from "react"
import { useJournalStore } from "@/hooks/use-journal-store"
import { calculateTradeMetrics } from "@/lib/calculations"
import type { Trade, AutoCalculated, TiltmeterScore } from "@/types"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { LoadingLogo } from "./LoadingLogo"
import { cn } from "@/lib/utils"
import { Badge } from "./ui/badge"
import FormattedNumber from "./ui/formatted-number"
import { getResultBadgeVariant, getStatusIcon } from "@/lib/trade-helpers"
import { Progress } from "./ui/progress"
import { Label } from "./ui/label"

type FullAutoCalculated = AutoCalculated & { tiltmeter: TiltmeterScore };

interface DiscrepancyPair {
  id: string;
  originalTrade: Trade;
  correctedTrade: Trade;
  changedFields: (keyof FullAutoCalculated)[];
}


const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function AuditDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void; }) {
    const { 
        journals,
        activeJournalId,
        appSettings,
        updateTrade 
    } = useJournalStore(state => ({ 
        journals: state.journals,
        activeJournalId: state.activeJournalId,
        appSettings: state.appSettings,
        updateTrade: state.updateTrade,
    }));
    
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);

  const [isLoading, setIsLoading] = useState(false)
  const [auditResult, setAuditResult] = useState<DiscrepancyPair[] | null>(null)
  const [selectedDiscrepancies, setSelectedDiscrepancies] = useState<Set<string>>(new Set());
  const { toast } = useToast()
  const [scannedCount, setScannedCount] = useState(0);

  const handleRunAudit = async () => {
    if (!activeJournal || activeJournal.trades.length === 0 || !appSettings) {
      toast({
        title: "No data to audit",
        description: "Add some trades to your journal first.",
        variant: "destructive"
      })
      return
    }
    setIsLoading(true);
    setAuditResult(null);
    setScannedCount(0);
    
    const discrepancies: DiscrepancyPair[] = [];
    const tradesToAudit = activeJournal.trades;

    for (let i = 0; i < tradesToAudit.length; i++) {
        const originalTrade = tradesToAudit[i];
        
        const correctedAuto = calculateTradeMetrics(originalTrade, activeJournal, appSettings);
        
        const correctedTrade = JSON.parse(JSON.stringify(originalTrade));
        correctedTrade.auto = { ...correctedTrade.auto, ...correctedAuto };
        
        const changedFields: (keyof FullAutoCalculated)[] = [];

        (Object.keys(correctedAuto) as Array<keyof FullAutoCalculated>).forEach(key => {
            const originalValue = originalTrade.auto[key];
            const correctedValue = correctedAuto[key];
            let isDiscrepant = false;

            if (key === 'score' || key === 'tiltmeter') {
                 if (JSON.stringify(originalValue) !== JSON.stringify(correctedValue)) {
                    isDiscrepant = true;
                }
            } else if (typeof originalValue === 'number' && typeof correctedValue === 'number') {
                if (Math.abs(originalValue - correctedValue) > 0.001) {
                    isDiscrepant = true;
                }
            } else if (JSON.stringify(originalValue) !== JSON.stringify(correctedValue)) {
                isDiscrepant = true;
            }

            if (isDiscrepant) {
                changedFields.push(key);
            }
        });
        
        if (changedFields.length > 0) {
            discrepancies.push({
                id: crypto.randomUUID(),
                originalTrade,
                correctedTrade,
                changedFields,
            });
        }
        
        setScannedCount(i + 1);
        if (i % 50 === 0) { // Yield to the main thread every 50 trades
             await sleep(0);
        }
    }
        
    setAuditResult(discrepancies);
    if (discrepancies.length > 0) {
        setSelectedDiscrepancies(new Set(discrepancies.map(d => d.id)));
    } else {
         toast({
            title: "Audit Complete",
            description: "No discrepancies found. Your data is clean!",
        })
    }
    setIsLoading(false);
  }
  
  const handleSelectAll = (checked: boolean) => {
    if (checked && auditResult) {
        setSelectedDiscrepancies(new Set(auditResult.map(d => d.id)));
    } else {
        setSelectedDiscrepancies(new Set());
    }
  }

  const handleSelectRow = (discrepancyId: string, checked: boolean) => {
    const newSelection = new Set(selectedDiscrepancies);
    if (checked) {
        newSelection.add(discrepancyId);
    } else {
        newSelection.delete(discrepancyId);
    }
    setSelectedDiscrepancies(newSelection);
  }

  const handleApplyCorrections = () => {
    if (!activeJournal || !auditResult) return;

    auditResult.forEach(discrepancy => {
        if (selectedDiscrepancies.has(discrepancy.id)) {
            // Re-apply the full corrected data to the original trade ID
            const tradeToUpdate = {
                ...discrepancy.correctedTrade,
                id: discrepancy.originalTrade.id, // Ensure we use the original ID to find the document
            };
            updateTrade(tradeToUpdate as Omit<Trade, 'auto'> & { id: string });
        }
    });

    toast({
        title: "Corrections Applied",
        description: `${selectedDiscrepancies.size} discrepancies have been fixed.`
    });
    onOpenChange(false);
    setAuditResult(null);
  };
  
  const renderCell = (trade: Trade, field: string, isCorrected: boolean, changedFields: string[]) => {
    const isChanged = changedFields.includes(field);
    const baseClasses = cn("p-1 text-[10px]", isChanged && (isCorrected ? "bg-green-500/20" : "bg-red-500/20"));
    
    switch(field) {
        case 'id': return <TableCell className={cn(baseClasses, 'font-mono')}>{trade.id.slice(0, 8)}...</TableCell>;
        case 'openDate': return <TableCell className={cn(baseClasses, "whitespace-nowrap")}>{trade.openDate} {trade.openTime}</TableCell>;
        case 'pair': return <TableCell className={baseClasses}>{trade.pair}</TableCell>;
        case 'direction': return <TableCell className={cn(baseClasses, trade.direction === 'Buy' ? 'text-green-500' : 'text-red-500')}>{trade.direction}</TableCell>;
        case 'outcome': return <TableCell className={baseClasses}><div className="flex items-center gap-1">{getStatusIcon(trade.auto.outcome)}<span>{trade.auto.outcome}</span></div></TableCell>;
        case 'result': return <TableCell className={baseClasses}><Badge className={cn("text-[9px] px-1.5 py-0", getResultBadgeVariant(trade.auto.result))}>{trade.auto.result}</Badge></TableCell>;
        case 'pl': return <TableCell className={cn(baseClasses, "text-right", trade.auto.pl >= 0 ? "text-green-500" : "text-red-500")}><FormattedNumber value={trade.auto.pl} /></TableCell>;
        case 'rr': return <TableCell className={cn(baseClasses, "text-right")}>{trade.auto.rr.toFixed(2)}</TableCell>;
        case 'score': return <TableCell className={cn(baseClasses, "text-right")}>{trade.auto.score?.value.toFixed(0)}</TableCell>;
        case 'tiltmeter': return <TableCell className={cn(baseClasses, "text-right")}>{trade.auto.tiltmeter?.finalTilt.toFixed(2)}</TableCell>;
        case 'holdingTime': return <TableCell className={cn(baseClasses, "whitespace-nowrap")}>{trade.auto.holdingTime}</TableCell>;
        default: return <TableCell className={baseClasses}></TableCell>;
    }
  };

  const columns = ['id', 'openDate', 'pair', 'direction', 'outcome', 'result', 'pl', 'rr', 'score', 'tiltmeter', 'holdingTime'];
  const columnHeaders: Record<string, string> = { id: 'ID', openDate: 'Open Date', pair: 'Pair', direction: 'Direction', outcome: 'Outcome', result: 'Result', pl: 'P/L ($)', rr: 'R:R', score: 'Score', tiltmeter: 'Tilt', holdingTime: 'Duration' };


  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            setAuditResult(null);
            setIsLoading(false);
            setSelectedDiscrepancies(new Set());
            setScannedCount(0);
        }
    }}>
      <DialogContent className="sm:max-w-7xl glassmorphic h-[80vh] flex flex-col bg-glass-cyan">
        <DialogHeader>
          <DialogTitle>Data Integrity Auditor</DialogTitle>
          <DialogDescription>
            Scan for calculation errors and outdated trade IDs, then apply corrections to ensure data accuracy.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex-1 min-h-0">
            {isLoading ? (
                <div className="flex flex-col justify-center items-center h-full gap-4">
                    <LoadingLogo />
                    <div className="w-full max-w-md space-y-2 text-center">
                        <p className="text-muted-foreground">Auditing data...</p>
                        <Progress value={(scannedCount / (activeJournal?.trades.length || 1)) * 100} />
                        <p className="text-xs text-muted-foreground">Scanned {scannedCount} of {activeJournal?.trades.length} trades</p>
                    </div>
                </div>
            ) : auditResult ? (
                auditResult.length > 0 ? (
                <ScrollArea className="h-full w-full">
                    <div className="min-w-[1200px]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                                <TableRow>
                                    <TableHead className="w-[40px] p-1 sticky left-0 z-20 bg-background/80">
                                        <Checkbox 
                                            checked={auditResult.length > 0 && selectedDiscrepancies.size === auditResult.length}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    {columns.map(col => <TableHead key={col} className={cn("p-1 h-auto text-[9px]", (col === 'pl' || col === 'rr' || col === 'score' || col === 'tiltmeter') && 'text-right')}>{columnHeaders[col]}</TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {auditResult.map((d) => (
                               <React.Fragment key={d.id}>
                                   {/* Original Row */}
                                   <TableRow>
                                      <TableCell rowSpan={2} className="p-1 align-middle sticky left-0 z-10">
                                           <Checkbox
                                              checked={selectedDiscrepancies.has(d.id)}
                                              onCheckedChange={(checked) => handleSelectRow(d.id, !!checked)}
                                          />
                                      </TableCell>
                                      {columns.map(col => renderCell(d.originalTrade, col, false, d.changedFields))}
                                   </TableRow>
                                   {/* Corrected Row */}
                                   <TableRow>
                                      {columns.map(col => renderCell(d.correctedTrade, col, true, d.changedFields))}
                                   </TableRow>
                               </React.Fragment>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                </ScrollArea>
                ) : (
                    <div className="text-center h-full flex flex-col items-center justify-center gap-4">
                        <p>No discrepancies found. Everything looks good!</p>
                        <Button onClick={handleRunAudit}>Run Again</Button>
                    </div>
                )
            ) : (
                <div className="text-center h-full flex flex-col items-center justify-center gap-4">
                    <p className="text-muted-foreground">Click "Run Audit" to scan for inconsistencies.</p>
                     <Button onClick={handleRunAudit} disabled={isLoading}>
                        {isLoading ? "Auditing..." : "Run Audit"}
                    </Button>
                </div>
            )}
        </div>
        <DialogFooter>
            {auditResult && auditResult.length > 0 && (
                <>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleApplyCorrections} disabled={selectedDiscrepancies.size === 0}>Apply {selectedDiscrepancies.size} Corrections</Button>
                </>
            )}
             {auditResult && auditResult.length === 0 && (
                <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

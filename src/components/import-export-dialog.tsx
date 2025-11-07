
'use client';

import { useState, useRef, DragEvent, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { AlertCircle, ArrowRight, UploadCloud, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ImportedTrade, parseTradeData } from '@/lib/trade-importer';
import { cn } from '@/lib/utils';
import { LoadingLogo } from './LoadingLogo';
import { Checkbox } from './ui/checkbox';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { calculateTradeMetrics } from '@/lib/calculations';
import type { AutoCalculated, Journal } from '@/types';
import FormattedNumber from './ui/formatted-number';
import { Label } from './ui/label';

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type NewPairConfig = {
    [pairName: string]: {
        pipSize: string;
        pipValue: string;
        spread: string;
    }
}

const ImportTab = ({ onParse, onDataPasted }: { onParse: (data: string) => void, onDataPasted: (data: string) => void }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pastedData, setPastedData] = useState("");

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setPastedData(content);
            onDataPasted(content);
            onParse(content); 
        };
        reader.onerror = () => {
             alert('Failed to read the file.');
        };
        reader.readAsText(file);
    };

    const handleFileSelect = (files: FileList | null) => {
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    }

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        handleFileSelect(files);
    };
    
    const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPastedData(e.target.value);
        onDataPasted(e.target.value);
    }

    return (
        <div className="space-y-4">
            <div 
                className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input type="file" ref={fileInputRef} className="hidden" accept=".htm,.html,.csv,.txt,.json" onChange={(e) => handleFileSelect(e.target.files)} />
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                    Drag & drop a trade history file or <span className="font-bold text-primary">click to browse</span>
                </p>
                <p className="text-xs text-muted-foreground/80 mt-1">
                    Supports HTML (from MT4/MT5), CSV, and raw text files.
                </p>
            </div>
            <div className="relative flex items-center">
                <span className="flex-shrink px-2 text-xs text-muted-foreground">OR</span>
                <div className="flex-grow border-t"></div>
            </div>
            <Textarea
                placeholder="Paste your trade history data here..."
                className="h-40 font-mono text-xs"
                value={pastedData}
                onChange={handlePasteChange}
            />
             <Button onClick={() => onParse(pastedData)} disabled={!pastedData.trim()} className="w-full">
                Parse & Preview Data
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
        </div>
    );
};


const getStatusIcon = (outcome: AutoCalculated['outcome']) => {
    if (outcome === 'Win') return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (outcome === 'Loss') return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-gray-500" />;
};

const getResultBadgeVariant = (result: AutoCalculated['result']) => {
    switch (result) {
        case 'TP': return 'bg-green-500/20 text-green-500';
        case 'SL': return 'bg-red-500/20 text-red-500';
        case 'BE': return 'bg-blue-500/20 text-blue-400';
        default: return 'bg-gray-500/20 text-gray-500';
    }
}


export default function ImportExportDialog({ open, onOpenChange }: ImportExportDialogProps) {
  const { importTradesBatch, activeJournal, appSettings, importJournal } = useJournalStore();
  const { toast } = useToast();
  const [step, setStep] = useState<'input' | 'parsing' | 'configure' | 'review' | 'importing'>('input');
  const [rawData, setRawData] = useState('');
  const [parsedTrades, setParsedTrades] = useState<ImportedTrade[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [newPairs, setNewPairs] = useState<string[]>([]);
  const [newPairsConfig, setNewPairsConfig] = useState<NewPairConfig>({});


  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('input');
      setRawData('');
      setParsedTrades([]);
      setSelectedIndexes(new Set());
      setError(null);
      setNewPairs([]);
      setNewPairsConfig({});
    }, 300);
  };
  
  const handleParse = async (dataToParse: string) => {
    if (!dataToParse.trim()) {
      setError('Please paste some data or upload a file to import.');
      return;
    }
    
    setStep('parsing');
    setError(null);

    setTimeout(async () => {
        try {
            const result = await parseTradeData(dataToParse);
            if (result && result.length > 0) {
                const existingPairs = Object.keys(appSettings.pairsConfig);
                const uniqueImportedPairs = [...new Set(result.map(t => t.pair))];
                const unknownPairs = uniqueImportedPairs.filter(p => !existingPairs.includes(p));

                setParsedTrades(result);
                setSelectedIndexes(new Set(result.map((_, index) => index)));
                
                if(unknownPairs.length > 0) {
                    setNewPairs(unknownPairs);
                    setNewPairsConfig(unknownPairs.reduce((acc, pair) => ({ ...acc, [pair]: { pipSize: '', pipValue: '', spread: '' } }), {}));
                    setStep('configure');
                } else {
                    setStep('review');
                }

            } else {
                setError('Could not find any valid trades. Please check the data format and try again.');
                setStep('input');
            }
        } catch (e: any) {
            console.error(e);
            setError(`An error occurred while parsing: ${e.message}. Please check your data format.`);
            setStep('input');
        }
    }, 50);
  };
  
  const handleConfirmImport = async () => {
    const tradesToImport = parsedTrades.filter((_, index) => selectedIndexes.has(index));
    if (tradesToImport.length === 0) {
        toast({ title: 'No trades selected', description: 'Please select at least one trade to import.', variant: 'destructive' });
        return;
    }
    
    setStep('importing');
    try {
      importTradesBatch(tradesToImport);
      toast({
        title: 'Import Successful',
        description: `${tradesToImport.length} trades have been added to your journal.`
      });
      handleClose();
    } catch (e) {
      console.error(e);
      toast({
        title: 'Import Failed',
        description: 'An error occurred while saving the trades.',
        variant: 'destructive',
      });
      setStep('review');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIndexes(new Set(parsedTrades.map((_, index) => index)));
    } else {
      setSelectedIndexes(new Set());
    }
  };

  const handleSelectRow = (index: number, checked: boolean) => {
    const newSelection = new Set(selectedIndexes);
    if (checked) {
      newSelection.add(index);
    } else {
      newSelection.delete(index);
    }
    setSelectedIndexes(newSelection);
  };

  const handleTradeDataChange = (index: number, field: keyof ImportedTrade, value: string | number) => {
    const newParsedTrades = [...parsedTrades];
    // @ts-ignore
    newParsedTrades[index][field] = value;
    setParsedTrades(newParsedTrades);
  };

  const handleNewPairConfigChange = (pair: string, field: keyof NewPairConfig[string], value: string) => {
    setNewPairsConfig(prev => ({
      ...prev,
      [pair]: {
        ...prev[pair],
        [field]: value
      }
    }));
  };

  const handleConfigureDone = () => {
    setStep('review');
  }

  const renderHeader = () => (
     <DialogHeader>
        <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <FileText /> Import Trades
        </DialogTitle>
        {step === 'input' && (
        <DialogDescription>
            Import trades from various sources like MT4/MT5 reports or custom CSV files.
        </DialogDescription>
        )}
         {step === 'review' && (
            <DialogDescription>
              Review and select the trades to import. Found {parsedTrades.length} potential trades. You can edit values before importing.
            </DialogDescription>
        )}
         {step === 'configure' && (
            <DialogDescription>
              New pairs detected! Please provide their configuration for accurate calculations.
            </DialogDescription>
        )}
    </DialogHeader>
  );

  const renderContent = () => {
    switch (step) {
      case 'input':
        return (
             <div className="py-4">
                 <ImportTab onParse={handleParse} onDataPasted={setRawData} />
                 {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                    </div>
                )}
            </div>
        );
       case 'parsing':
       case 'importing':
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <LoadingLogo />
                <p className="text-muted-foreground">{step === 'parsing' ? 'Parsing your data...' : 'Importing your trades...'}</p>
            </div>
        );
      case 'configure':
        return (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Configure New Pairs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {newPairs.map(pair => (
                            <div key={pair} className="p-3 border rounded-md bg-muted/50">
                                <Label className="font-bold">{pair}</Label>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                     <Input placeholder="Pip Size" value={newPairsConfig[pair].pipSize} onChange={e => handleNewPairConfigChange(pair, 'pipSize', e.target.value)} />
                                    <Input placeholder="Pip Value ($)" value={newPairsConfig[pair].pipValue} onChange={e => handleNewPairConfigChange(pair, 'pipValue', e.target.value)} />
                                    <Input placeholder="Spread (pips)" value={newPairsConfig[pair].spread} onChange={e => handleNewPairConfigChange(pair, 'spread', e.target.value)} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
      case 'review':
        const dynamicPairsConfig = {
            ...appSettings.pairsConfig,
            ...Object.entries(newPairsConfig).reduce((acc, [pair, config]) => {
                acc[pair] = {
                    pipSize: parseFloat(config.pipSize) || 0.0001,
                    pipValue: parseFloat(config.pipValue) || 10,
                    spread: parseFloat(config.spread) || 2.0
                };
                return acc;
            }, {} as any)
        };
        
        return (
            <div className="h-full w-full overflow-auto glassmorphic p-2 rounded-lg">
                <Table className="text-xs">
                    <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                        <TableRow>
                            <TableHead className="p-2 w-12 sticky left-0 z-20 bg-background/80">
                                <Checkbox
                                    checked={selectedIndexes.size === parsedTrades.length && parsedTrades.length > 0}
                                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                                />
                            </TableHead>
                            {/* Inputs */}
                            <TableHead className="whitespace-nowrap sticky left-12 z-20 bg-background/80 p-2">Open Date</TableHead>
                            <TableHead className="whitespace-nowrap p-2">Open Time</TableHead>
                            <TableHead className="whitespace-nowrap p-2">Pair</TableHead>
                            <TableHead className="whitespace-nowrap p-2">Direction</TableHead>
                            <TableHead className="text-right whitespace-nowrap p-2">Lot Size</TableHead>
                            <TableHead className="text-right whitespace-nowrap p-2">Entry Price</TableHead>
                            <TableHead className="text-right whitespace-nowrap p-2">Close Price</TableHead>
                            <TableHead className="text-right whitespace-nowrap p-2">SL</TableHead>
                            <TableHead className="text-right whitespace-nowrap p-2">TP</TableHead>
                            <TableHead className="whitespace-nowrap p-2">Strategy</TableHead>
                            {/* Outputs */}
                            <TableHead className="whitespace-nowrap p-2">Result</TableHead>
                            <TableHead className="whitespace-nowrap p-2">Status</TableHead>
                            <TableHead className="text-right whitespace-nowrap p-2">P/L ($)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {parsedTrades.map((trade, index) => {
                             const mockTradeForCalc = { ...trade, id: `temp:${index}`, auto: {} as AutoCalculated, hasPartial: false, partials: [], breakeven: {type: 'No Break Even'}, sentiment: {Before:[],During:[],After:[]}, images: [], note:[], bias: [], discountPremiumZones:[], liquidity:[], entryReasons:[], indicators:[], mae:0,mfe:0, customStats:{}};
                             const auto = activeJournal && appSettings ? calculateTradeMetrics(mockTradeForCalc, activeJournal, { ...appSettings, pairsConfig: dynamicPairsConfig }) : null;
                             const { pl, result, outcome } = auto || { pl: 0, result: 'Stop', outcome: 'Neutral' };
                             
                            return (
                                <TableRow key={index} data-state={selectedIndexes.has(index) && "selected"}>
                                    <TableCell className="p-2 sticky left-0 bg-background/80 backdrop-blur-sm z-10">
                                        <Checkbox
                                            checked={selectedIndexes.has(index)}
                                            onCheckedChange={(checked) => handleSelectRow(index, Boolean(checked))}
                                        />
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap sticky left-12 bg-background/80 backdrop-blur-sm z-10 p-2"><Input className="h-7 text-xs" value={trade.openDate} onChange={e => handleTradeDataChange(index, 'openDate', e.target.value)} /></TableCell>
                                    <TableCell className="p-2"><Input className="h-7 text-xs" value={trade.openTime} onChange={e => handleTradeDataChange(index, 'openTime', e.target.value)} /></TableCell>
                                    <TableCell className="p-2"><Input className="h-7 text-xs" value={trade.pair} onChange={e => handleTradeDataChange(index, 'pair', e.target.value)} /></TableCell>
                                    <TableCell className="p-2"><Input className="h-7 text-xs" value={trade.direction} onChange={e => handleTradeDataChange(index, 'direction', e.target.value)} /></TableCell>
                                    <TableCell className="p-2 text-right"><Input className="h-7 text-xs text-right" type="number" value={trade.lotSize} onChange={e => handleTradeDataChange(index, 'lotSize', parseFloat(e.target.value))} /></TableCell>
                                    <TableCell className="p-2 text-right"><Input className="h-7 text-xs text-right" type="number" value={trade.entryPrice} onChange={e => handleTradeDataChange(index, 'entryPrice', parseFloat(e.target.value))} /></TableCell>
                                    <TableCell className="p-2 text-right"><Input className="h-7 text-xs text-right" type="number" value={trade.closingPrice} onChange={e => handleTradeDataChange(index, 'closingPrice', parseFloat(e.target.value))} /></TableCell>
                                    <TableCell className="p-2 text-right"><Input className="h-7 text-xs text-right" type="number" value={trade.stopLoss} onChange={e => handleTradeDataChange(index, 'stopLoss', parseFloat(e.target.value))} /></TableCell>
                                    <TableCell className="p-2 text-right"><Input className="h-7 text-xs text-right" type="number" value={trade.takeProfit} onChange={e => handleTradeDataChange(index, 'takeProfit', parseFloat(e.target.value))} /></TableCell>
                                    <TableCell className="p-2"><Input className="h-7 text-xs" value={trade.strategy} onChange={e => handleTradeDataChange(index, 'strategy', e.target.value)} /></TableCell>
                                    {/* Calculated Outputs */}
                                    <TableCell className="p-2"><Badge className={getResultBadgeVariant(result)}>{result}</Badge></TableCell>
                                    <TableCell className="p-2"><div className="flex items-center gap-2">{getStatusIcon(outcome)}<span>{outcome}</span></div></TableCell>
                                    <TableCell className={cn("p-2 text-right font-semibold", outcome === 'Win' ? 'text-green-500' : outcome === 'Loss' ? 'text-red-500' : '')}><FormattedNumber value={pl} /></TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        );
    }
  };
  
   const renderFooter = () => {
    switch (step) {
      case 'input':
        return (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Close</Button>
          </DialogFooter>
        );
        case 'configure':
        return (
          <DialogFooter>
            <Button variant="outline" onClick={() => setStep('input')}>Back</Button>
            <Button onClick={handleConfigureDone}>Continue to Review</Button>
          </DialogFooter>
        );
      case 'review':
        return (
          <DialogFooter>
            <p className="text-sm text-muted-foreground mr-auto">{selectedIndexes.size} of {parsedTrades.length} trades selected.</p>
            <Button variant="outline" onClick={() => setStep(newPairs.length > 0 ? 'configure' : 'input')}>Back</Button>
            <Button onClick={handleConfirmImport} disabled={selectedIndexes.size === 0}>
                Import {selectedIndexes.size} Trades
            </Button>
          </DialogFooter>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
       <DialogContent className="glassmorphic sm:max-w-7xl h-[90vh] flex flex-col">
        {renderHeader()}
        <div className="flex-1 min-h-0">
            {renderContent()}
        </div>
        {renderFooter()}
      </DialogContent>
    </Dialog>
  );
}

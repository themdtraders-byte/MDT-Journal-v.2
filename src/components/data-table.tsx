
'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileDown,
  Merge,
  Trash2,
  View as EyeIcon,
  AlertCircle,
  Settings2,
  Copy,
  Pencil,
  MoreVertical,
  ArrowUpDown,
  Tag,
  NotebookText,
  Image as ImageIcon,
  Calendar as CalendarIcon,
  Filter,
  BarChart,
  GripVertical,
  TrendingDown, TrendingUp, Minus,
  Layers,
  LayoutGrid,
  List
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DndContext, closestCenter, DragEndEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/hooks/use-toast';
import type { Trade, Filters } from '@/types';
import { cn } from '@/lib/utils';
import TradeDetailDialog from '@/components/trade-detail-dialog';
import PairIcon from '@/components/PairIcon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Tiltmeter from '@/components/Tiltmeter';
import FormattedNumber from '@/components/ui/formatted-number';
import { useRouter } from 'next/navigation';
import { getStatusIcon, getResultBadgeVariant } from '@/lib/trade-helpers';
import { format } from 'date-fns';
import ImportExportDialog from '@/components/import-export-dialog';
import ExportDialog from '@/components/export-dialog';
import LayersAndPartialsDialog from '@/components/layers-and-partials-dialog';
import type { LayerData, PartialCloseData } from '@/components/add-trade-dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import TradeCard from '@/components/trade-card';


// --- Type Definitions ---
type SortableKeys = keyof Trade | `auto.${keyof Trade['auto']}`;
type SortConfig = {
  key: SortableKeys;
  direction: 'ascending' | 'descending';
};

// --- Column Configuration ---
type ColumnConfig = {
  id: SortableKeys | 'actions' | 'select' | 'indicators' | 'tiltmeter';
  header: string;
  visible: boolean;
  sortable: boolean;
  filterable?: boolean;
  filterKey?: keyof Filters;
  className?: string;
};

// Moved outside the component to prevent re-creation on every render
const initialColumnsConfig: ColumnConfig[] = [
    { id: 'select', header: 'Select', visible: true, sortable: false },
    { id: 'openDate', header: 'Open Date', visible: true, sortable: true },
    { id: 'auto.status', header: 'Status', visible: true, sortable: true, filterable: true, filterKey: 'status' },
    { id: 'closeDate', header: 'Close Date', visible: false, sortable: true },
    { id: 'pair', header: 'Pair', visible: true, sortable: true, filterable: true, filterKey: 'pair' },
    { id: 'direction', header: 'Direction', visible: true, sortable: true, filterable: true, filterKey: 'direction' },
    { id: 'lotSize', header: 'Lot Size', visible: false, sortable: true },
    { id: 'entryPrice', header: 'Entry Price', visible: false, sortable: true },
    { id: 'closingPrice', header: 'Close Price', visible: false, sortable: true },
    { id: 'stopLoss', header: 'Stop Loss', visible: false, sortable: true },
    { id: 'takeProfit', header: 'Take Profit', visible: false, sortable: true },
    { id: 'auto.pips', header: 'Pips', visible: false, sortable: true },
    { id: 'auto.pl', header: 'P/L ($)', visible: true, sortable: true },
    { id: 'auto.riskPercent', header: 'Risk %', visible: false, sortable: true },
    { id: 'auto.gainPercent', header: 'Gain %', visible: false, sortable: true },
    { id: 'auto.result', header: 'Result', visible: true, sortable: true, filterable: true, filterKey: 'result' },
    { id: 'auto.outcome', header: 'Outcome', visible: true, sortable: true, filterable: true, filterKey: 'outcome' },
    { id: 'auto.rr', header: 'R:R', visible: true, sortable: true },
    { id: 'auto.session', header: 'NY Time Session', visible: false, sortable: true, filterable: true, filterKey: 'session' },
    { id: 'strategy', header: 'Strategy', visible: false, sortable: true, filterable: true, filterKey: 'strategy' },
    { id: 'auto.score', header: 'Score', visible: true, sortable: true },
    { id: 'auto.holdingTime', header: 'Holding Time', visible: true, sortable: true },
    { id: 'indicators', header: 'Indicators', visible: true, sortable: false },
    { id: 'note', header: 'Note', visible: false, sortable: false },
    { id: 'actions', header: 'Actions', visible: true, sortable: false },
    { id: 'tiltmeter', header: 'Tiltmeter', visible: true, sortable: false },
  ];

const SortableColumnBadge = ({ column }: { column: ColumnConfig }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: column.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-1 touch-none">
            <span {...attributes} {...listeners} className="cursor-grab p-1">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </span>
            <Badge
                variant={column.visible ? 'default' : 'secondary'}
                className="flex-grow cursor-pointer"
            >
                {column.header}
            </Badge>
        </div>
    );
};

export default function DataTable({
  trades: propTrades,
  selectedTradeIds: propSelectedTradeIds,
  onSelectionChange: propOnSelectionChange,
  actions: propActions,
}: {
  trades?: Trade[];
  selectedTradeIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  actions?: React.ReactNode;
}) {
  const router = useRouter();
  const { 
    clearFilters, journals, activeJournalId, deleteTrade, deleteTrades, mergeTrades, 
    duplicateTrades, addTradeDraft, setActiveTradeDraftId, updateTradesTag, appSettings, filters, applyFilters 
  } = useJournalStore();
  
  const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
  const allTrades = useMemo(() => activeJournal?.trades || [], [activeJournal]);

  const filteredTrades = useMemo(() => {
    if (!activeJournal) return [];
    // This is a simplified filtering logic based on your store structure.
    // You would expand this with all the conditions from your original useJournalStoreWithDerived.
    if (!filters || Object.values(filters).every(v => !v || (Array.isArray(v) && v.length === 0))) {
        return allTrades;
    }
    return allTrades.filter(trade => {
        if (filters.pair && filters.pair.length > 0 && !filters.pair.includes(trade.pair)) {
            return false;
        }
         if (filters.direction && filters.direction.length > 0 && !filters.direction.includes(trade.direction)) {
            return false;
        }
        // Add other filter checks here...
        return true;
    });
  }, [allTrades, filters, activeJournal]);

  const { toast } = useToast();
  
  const [localSelectedTradeIds, setLocalSelectedTradeIds] = useState<Set<string>>(new Set());
  const selectedTradeIds = propSelectedTradeIds ?? localSelectedTradeIds;
  const onSelectionChange = propOnSelectionChange ?? setLocalSelectedTradeIds;

  const [columns, setColumns] = useState<ColumnConfig[]>(initialColumnsConfig);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const [activeDialogTab, setActiveDialogTab] = useState<'overview' | 'notes' | 'visuals'>('overview');
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'openDate', direction: 'descending' });
  const [tagInput, setTagInput] = useState('');
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLayersDialogOpen, setIsLayersDialogOpen] = useState(false);
  const [layersDialogTrade, setLayersDialogTrade] = useState<Trade | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const tradesToDisplay = propTrades || filteredTrades;
  const selectedTrades = useMemo(() => tradesToDisplay.filter(t => selectedTradeIds.has(t.id)), [tradesToDisplay, selectedTradeIds]);
  
  const handleEditTrade = (trade: Trade) => {
    const draftId = addTradeDraft(trade);
    setActiveTradeDraftId(draftId);
    router.push('/add-trade');
  };

  useEffect(() => {
    if (!propTrades) {
      return () => {
        clearFilters();
      };
    }
  }, [clearFilters, propTrades]);


  const columnFilterOptions = useMemo(() => {
    const options: { [key in keyof Filters]?: string[] } = {};
    const filterableColumns = columns.filter(c => c.filterable && c.filterKey);
    
    filterableColumns.forEach(col => {
      const key = col.filterKey as keyof Filters;
      const values = new Set<string>();
      allTrades.forEach(trade => {
        let value: any;
        if (String(col.id).startsWith('auto.')) {
            const subKey = String(col.id).substring(5);
            value = (trade.auto as any)[subKey];
        } else {
            value = (trade as any)[col.id];
        }
        if (value !== undefined && value !== null && value !== '') {
            values.add(String(value));
        }
      });
      options[key] = Array.from(values).sort();
    });

    return options;
  }, [allTrades, columns]);

  const handleColumnFilterChange = (filterKey: keyof Filters, value: string) => {
    const currentFilterValues = (filters[filterKey] as string[] | undefined) || [];
    let newFilterValues: string[];

    if (value === 'All') {
        newFilterValues = []; 
    } else {
        const isSelected = currentFilterValues.includes(value);
        if (isSelected) {
            newFilterValues = currentFilterValues.filter(v => v !== value);
        } else {
            newFilterValues = [...currentFilterValues, value];
        }
    }

    const allOptions = columnFilterOptions[filterKey] || [];
    if (newFilterValues.length === allOptions.length) {
        newFilterValues = [];
    }

    applyFilters({ ...filters, [filterKey]: newFilterValues });
  };

  const handleColumnVisibilityChange = (columnId: ColumnConfig['id']) => {
    setColumns(currentColumns =>
        currentColumns.map(c =>
            c.id === columnId ? { ...c, visible: !c.visible } : c
        )
    );
  };
  
  const handleSelectRow = useCallback((tradeId: string, checked: boolean) => {
    onSelectionChange(prev => {
        const newSelection = new Set(prev);
        if (checked) {
            newSelection.add(tradeId);
        } else {
            newSelection.delete(tradeId);
        }
        return newSelection;
    });
  }, [onSelectionChange]);

  const openTradeDialog = (trade: Trade, tab: 'overview' | 'notes' | 'visuals' = 'overview') => {
      setViewingTrade(trade);
      setActiveDialogTab(tab);
  };

  const getAccessor = useCallback((trade: Trade, id: ColumnConfig['id']): React.ReactNode => {
    switch (id) {
        case 'select':
            return (
                <Checkbox
                    checked={selectedTradeIds.has(trade.id)}
                    onCheckedChange={(checked) => handleSelectRow(trade.id, !!checked)}
                    aria-label={`Select trade ${trade.id}`}
                />
            );
        case 'openDate': return `${format(new Date(trade.openDate + 'T00:00:00'), 'dd/MM/yyyy')} ${trade.openTime}`;
        case 'closeDate': return `${trade.closeDate ? format(new Date(trade.closeDate + 'T00:00:00'), 'dd/MM/yyyy') : ''} ${trade.closeTime}`;
        case 'pair': return <div className="flex items-center gap-1.5"><PairIcon pair={trade.pair} className="h-5 w-5" /><span>{trade.pair}</span></div>;
        case 'direction': return <span className={trade.direction === 'Buy' ? 'text-green-500' : 'text-red-500'}>{trade.direction}</span>;
        case 'lotSize': return typeof trade.lotSize === 'number' ? trade.lotSize.toFixed(2) : '0.00';
        case 'entryPrice': return <FormattedNumber value={trade.entryPrice} isPrice />;
        case 'closingPrice': return <FormattedNumber value={trade.closingPrice} isPrice />;
        case 'stopLoss': return <FormattedNumber value={trade.stopLoss} isPrice />;
        case 'takeProfit': return <FormattedNumber value={trade.takeProfit} isPrice />;
        case 'auto.pips': return <span className={cn(trade.auto.pips >= 0 ? 'text-green-500' : 'text-red-500')}>{trade.auto.pips.toFixed(1)}</span>;
        case 'auto.pl': return <span className={cn('font-semibold', trade.auto.pl >= 0 ? 'text-green-500' : 'text-red-500')}><FormattedNumber value={trade.auto.pl} showPercentage /></span>;
        case 'auto.riskPercent': return `${trade.auto.riskPercent.toFixed(2)}%`;
        case 'auto.gainPercent': return `${trade.auto.gainPercent.toFixed(2)}%`;
        case 'auto.result': return <Badge className={cn("px-1.5 py-0 text-[9px]", getResultBadgeVariant(trade.auto.result))}>{trade.auto.result}</Badge>;
        case 'auto.outcome': return <div className="flex items-center gap-1">{getStatusIcon(trade.auto.outcome)}<span>{trade.auto.outcome}</span></div>;
        case 'auto.status': return <Badge variant={trade.auto.status === 'Open' ? 'outline' : 'secondary'} className={cn(trade.auto.status === 'Open' && 'text-yellow-500 border-yellow-500/50', trade.auto.status === 'Closed' && 'bg-secondary/50')}>{trade.auto.status}</Badge>;
        case 'auto.rr': return trade.auto.rr.toFixed(2);
        case 'auto.session': return trade.auto.session;
        case 'strategy': return trade.strategy || 'N/A';
        case 'auto.score': return trade.auto.score ? (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                        <AlertCircle className="h-3 w-3" style={{ color: trade.auto.score?.color }} />
                        <span>{trade.auto.score?.value}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent><p>{trade.auto.score?.remark}</p></TooltipContent>
            </Tooltip>
        ) : <span className="text-muted-foreground">N/A</span>;
        case 'auto.holdingTime': return trade.auto.holdingTime;
        case 'indicators': {
            const hasNotes = (Array.isArray(trade.note) && trade.note.some(n => n.content.trim() !== '')) || (trade.lessonsLearned && trade.lessonsLearned.trim() !== '');
            const hasImages = (trade.images && trade.images.length > 0) || (trade.imagesByTimeframe && Object.values(trade.imagesByTimeframe).some(arr => arr.length > 0));
            const hasTag = !!trade.tag;
            const hasLayersOrPartials = (trade.layers && trade.layers.length > 0) || (trade.partials && trade.partials.length > 0);

            return (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    {hasTag && <Tooltip><TooltipTrigger><Tag className="h-3 w-3"/></TooltipTrigger><TooltipContent><p>Tag: {trade.tag}</p></TooltipContent></Tooltip>}
                    {hasNotes && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={(e) => { e.stopPropagation(); openTradeDialog(trade, 'notes'); }} className="p-0 m-0 h-auto bg-transparent border-0"><NotebookText className="h-3 w-3"/></button>
                            </TooltipTrigger><TooltipContent><p>View Notes</p></TooltipContent>
                        </Tooltip>
                    )}
                    {hasImages && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={(e) => { e.stopPropagation(); openTradeDialog(trade, 'visuals'); }} className="p-0 m-0 h-auto bg-transparent border-0">
                                    <ImageIcon className="h-3 w-3"/>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent><p>View Images</p></TooltipContent>
                        </Tooltip>
                    )}
                    {hasLayersOrPartials && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                 <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLayersDialogTrade(trade);
                                        setIsLayersDialogOpen(true);
                                    }}
                                    className="p-0 m-0 h-auto bg-transparent border-0"
                                >
                                    <Layers className="h-3 w-3" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent><p>View Layers/Partials</p></TooltipContent>
                        </Tooltip>
                    )}
                </div>
            );
        }
        case 'note': return <p className="truncate max-w-xs">{Array.isArray(trade.note) ? trade.note.map(n => n.content.replace(/<[^>]+>/g, '')).join(' ') : ''}</p>;
        case 'tiltmeter': {
             if (!appSettings || !trade.stopLoss) return null;
             const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
             if(trade.stopLoss === 0) return null; // Avoid division by zero
             const riskDollars = Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize * trade.lotSize * pairInfo.pipValue;
             const realizedR = riskDollars > 0 ? trade.auto.pl / riskDollars : 0;
             return <Tiltmeter trade={trade} realizedR={realizedR} className="w-16 h-3" />;
        }
        case 'actions': return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="h-3 w-3"/></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => openTradeDialog(trade)}><EyeIcon className="mr-2 h-4 w-4"/>View Details</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleEditTrade(trade)}><Pencil className="mr-2 h-4 w-4"/>Edit Trade</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setTradeToDelete(trade)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4"/>Delete Trade
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
        default: return null;
    }
  }, [appSettings, selectedTradeIds, handleSelectRow, router]);
  
  const sortedTrades = useMemo(() => {
    let sortableTrades = [...tradesToDisplay];
    if (sortConfig !== null) {
        sortableTrades.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            if (sortConfig.key.startsWith('auto.')) {
                const subKey = sortConfig.key.substring(5) as keyof Trade['auto'];
                aValue = a.auto[subKey];
                bValue = b.auto[subKey];
            } else {
                aValue = a[sortConfig.key as keyof Trade];
                bValue = b[sortConfig.key as keyof Trade];
            }
            
            if (sortConfig.key === 'openDate') {
                aValue = new Date(`${a.openDate}T${a.openTime}`).getTime();
                bValue = new Date(`${b.openDate}T${b.openTime}`).getTime();
            } else if (sortConfig.key === 'closeDate') {
                aValue = new Date(`${a.closeDate}T${a.closeTime}`).getTime();
                bValue = new Date(`${b.closeDate}T${b.closeTime}`).getTime();
            } else if (sortConfig.key === 'auto.score') {
                aValue = a.auto.score.value;
                bValue = b.auto.score.value;
            } else if (sortConfig.key === 'auto.holdingTime') {
                aValue = a.auto.durationMinutes;
                bValue = b.auto.durationMinutes;
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }
    return sortableTrades;
  }, [tradesToDisplay, sortConfig]);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    if (!isClient || !activeJournal?.id) return;
    const savedColumns = localStorage.getItem(`mdjournal-table-columns-${activeJournal.id}`);
    if (savedColumns) {
        try {
            const parsed = JSON.parse(savedColumns);
            // Reconcile saved columns with initial config to add new columns
            const newColsFromConfig = initialColumnsConfig.filter(initCol => !parsed.some((p: {id: string}) => p.id === initCol.id));
            // Create a map of the initial columns for easy lookup
            const initialColsMap = new Map(initialColumnsConfig.map(col => [col.id, col]));
            // Re-order saved columns and add new ones at the end
            const ordered = parsed
                .map((p: {id: string, visible: boolean}) => {
                    const baseCol = initialColsMap.get(p.id);
                    return baseCol ? { ...baseCol, visible: p.visible } : null;
                })
                .filter(Boolean);
            
            setColumns([...ordered, ...newColsFromConfig] as ColumnConfig[]);

        } catch (e) {
            console.error("Failed to parse saved column config", e);
            setColumns(initialColumnsConfig);
        }
    } else {
        setColumns(initialColumnsConfig);
    }
  }, [activeJournal?.id, isClient]);

  useEffect(() => {
    if(activeJournal?.id && isClient) {
        const configToSave = columns.map(({ id, visible }) => ({ id, visible }));
        localStorage.setItem(`mdjournal-table-columns-${activeJournal.id}`, JSON.stringify(configToSave));
    }
  }, [columns, activeJournal?.id, isClient]);

  const handleSelectAll = (checked: boolean) => {
    onSelectionChange(checked ? new Set(sortedTrades.map(t => t.id)) : new Set());
  };
  
  const handleConfirmDelete = () => {
    if (tradeToDelete) {
        deleteTrade(tradeToDelete.id);
        toast({ title: "Trade Moved to Trash", description: `The trade will be permanently deleted in 3 days.` });
        setTradeToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    deleteTrades(Array.from(selectedTradeIds));
    toast({ title: "Trades Moved to Trash", description: `${selectedTradeIds.size} trades will be permanently deleted in 3 days.` });
    onSelectionChange(new Set());
  };
  

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );
  
  const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
          setColumns((items) => {
              const oldIndex = items.findIndex((item) => item.id === active.id);
              const newIndex = items.findIndex((item) => item.id === over.id);
              return arrayMove(items, oldIndex, newIndex);
          });
      }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLTableRowElement | HTMLDivElement>, trade: Trade) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.shiftKey) {
            handleEditTrade(trade);
        } else {
            openTradeDialog(trade);
        }
    }
  }, [router]);
  
  const visibleColumns = columns.filter(c => c.visible);
  
  const internalActions = (
    <div className="flex items-center gap-2">
      {selectedTradeIds.size > 0 && (
        <div className="flex items-center gap-2 animate-fade-in">
          <span className="text-sm text-muted-foreground">{selectedTradeIds.size} selected</span>
          <Popover open={isTagPopoverOpen} onOpenChange={setIsTagPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="xs"><Tag className="mr-2 h-4 w-4"/>Add Tag</Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="space-y-2">
                <Label>Tag</Label>
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)} />
                <Button size="xs" className="w-full" onClick={() => {
                    updateTradesTag(Array.from(selectedTradeIds), tagInput);
                    toast({ title: "Tags Updated" });
                    setTagInput('');
                    setIsTagPopoverOpen(false);
                }}>Apply Tag</Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="xs" onClick={() => { duplicateTrades(Array.from(selectedTradeIds)); toast({ title: "Trades Duplicated" }); onSelectionChange(new Set()); }}><Copy className="mr-2 h-4 w-4"/>Duplicate</Button>
          <Button variant="outline" size="xs" onClick={() => { mergeTrades(Array.from(selectedTradeIds)); toast({ title: "Trades Merged" }); onSelectionChange(new Set()); }}><Merge className="mr-2 h-4 w-4"/>Merge</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="xs"><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>This action will move the selected {selectedTradeIds.size} trade(s) to the trash.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDelete}>Move to Trash</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      <Button variant="outline" size="xs" onClick={() => router.push('/performance/chart')}><BarChart className="mr-2 h-4 w-4"/>Chart Lab</Button>
      <Button variant="outline" size="xs" onClick={() => router.push('/data/calendar')}><CalendarIcon className="mr-2 h-4 w-4"/>Calendar</Button>
      <Popover>
        <PopoverTrigger asChild>
            <Button variant="outline" size="xs"><Settings2 className="mr-2 h-4 w-4"/>View</Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-4">
            <div className="space-y-4">
                <Label className="text-base font-semibold">Customize Columns</Label>
                <p className="text-xs text-muted-foreground">Click to toggle visibility. Drag to reorder.</p>
                <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                   <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                        <SortableContext items={columns.map(c => c.id)} strategy={verticalListSortingStrategy}>
                            {columns.filter(c => c.id !== 'select').map((column) => (
                                <div key={column.id} onClick={() => handleColumnVisibilityChange(column.id)}>
                                    <SortableColumnBadge column={column as ColumnConfig}/>
                                </div>
                            ))}
                        </SortableContext>
                   </DndContext>
                </div>
            </div>
        </PopoverContent>
      </Popover>
    </div>
  );
  
  const displayActions = propActions ?? internalActions;

  if (!isClient || !activeJournal) return null;

  return (
    <TooltipProvider>
    <div className="space-y-6 h-full flex flex-col">
      {!propTrades && (
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Trade Log</h1>
             <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)} size="sm">
                <ToggleGroupItem value="table" aria-label="Table view"><List className="h-4 w-4"/></ToggleGroupItem>
                <ToggleGroupItem value="cards" aria-label="Cards view"><LayoutGrid className="h-4 w-4"/></ToggleGroupItem>
            </ToggleGroup>
        </div>
        {displayActions}
      </div>
      )}

      {propTrades && (
          <div className="flex justify-between items-center">
              <div></div> {/* Placeholder for title if needed */}
              {displayActions}
          </div>
      )}
      
      {viewMode === 'table' ? (
      <Card className="glassmorphic flex-1 flex flex-col min-h-0">
        <CardContent className="pt-6 flex-1 flex flex-col min-h-0">
          <div className="overflow-auto h-full w-full">
            <Table>
                <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                  <TableRow>
                    {visibleColumns.map((col) => (
                      <TableHead key={col.id} className={cn("py-1 px-1 h-auto whitespace-nowrap", col.className, col.id === 'select' && 'sticky left-0 bg-background/80 backdrop-blur-sm z-20')}>
                        {col.id === 'select' ? (
                          <Checkbox
                            checked={sortedTrades.length > 0 && selectedTradeIds.size === sortedTrades.length}
                            onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                          />
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              onClick={() => col.sortable && requestSort(col.id as SortableKeys)}
                              className="p-0 h-auto hover:bg-transparent text-muted-foreground text-[10px]"
                              disabled={!col.sortable}
                            >
                                {col.header}
                                {col.sortable && (
                                  <ArrowUpDown className={cn(
                                    "h-3 w-3 ml-1",
                                    sortConfig?.key === col.id ? "text-foreground" : ""
                                  )}/>
                                )}
                            </Button>
                            {!propTrades && col.filterable && col.filterKey && (columnFilterOptions[col.filterKey] || []).length > 0 && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                                    <Filter className="h-2.5 w-2.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuLabel>{col.header} Filter</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem
                                        checked={(filters[col.filterKey!]?.length || 0) === 0}
                                        onCheckedChange={() => handleColumnFilterChange(col.filterKey!, 'All')}
                                    >
                                        All
                                    </DropdownMenuCheckboxItem>
                                     {(columnFilterOptions[col.filterKey] || []).map(option => {
                                        const currentFilterValues = (filters[col.filterKey!] as string[] | undefined) || [];
                                        const isChecked = currentFilterValues.includes(option);
                                        
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={option}
                                                checked={isChecked}
                                                onCheckedChange={() => handleColumnFilterChange(col.filterKey!, option)}
                                            >
                                                {option}
                                            </DropdownMenuCheckboxItem>
                                        )
                                    })}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
              <TableBody>
                {sortedTrades.map(trade => (
                  <TableRow 
                    key={trade.id} 
                    data-state={selectedTradeIds.has(trade.id) ? "selected" : ""}
                    className={cn(
                        "relative",
                        trade.auto.outcome === 'Win' && 'bg-win-bg hover:bg-win-bg-hover data-[state=selected]:bg-win-bg-selected',
                        trade.auto.outcome === 'Loss' && 'bg-loss-bg hover:bg-loss-bg-hover data-[state=selected]:bg-loss-bg-selected'
                    )}
                    onContextMenu={(e) => handleContextMenu(e, trade)}
                  >
                     {visibleColumns.map((col, index) => (
                        <TableCell 
                            key={col.id} 
                            className={cn(
                                "relative py-0.5 px-1 whitespace-nowrap text-[10px]", 
                                col.className, 
                                col.id === 'select' && 'sticky left-0 z-10',
                                col.id === 'select' && trade.auto.outcome === 'Win' && 'bg-win-bg data-[state=selected]:bg-win-bg-selected',
                                col.id === 'select' && trade.auto.outcome === 'Loss' && 'bg-loss-bg data-[state=selected]:bg-loss-bg-selected',
                                col.id === 'select' && trade.auto.outcome !== 'Win' && trade.auto.outcome !== 'Loss' && 'bg-background/80'
                            )}
                        >
                            {col.id !== 'select' && index === 1 && trade.tag && (
                                <div className="absolute left-0 top-0 h-full w-16 overflow-hidden pointer-events-none">
                                    <div className="absolute top-2 -left-6 transform -rotate-45 bg-primary/20 text-primary font-bold text-[8px] px-1 py-0.5 whitespace-nowrap tracking-wider uppercase">
                                        {trade.tag}
                                    </div>
                                </div>
                            )}
                            {getAccessor(trade, col.id)}
                        </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      ) : (
         <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {sortedTrades.map(trade => (
                    <TradeCard 
                        key={trade.id} 
                        trade={trade} 
                        onClick={() => openTradeDialog(trade)}
                        onContextMenu={(e) => handleContextMenu(e, trade)}
                    />
                ))}
            </div>
        </div>
      )}
      
      <TradeDetailDialog
        trade={viewingTrade}
        isOpen={!!viewingTrade}
        onOpenChange={(open) => !open && setViewingTrade(null)}
        defaultTab={activeDialogTab}
      />

      {layersDialogTrade && (
        <LayersAndPartialsDialog 
            isOpen={isLayersDialogOpen}
            onClose={() => setIsLayersDialogOpen(false)}
            mainTradeData={{}}
            initialLayers={layersDialogTrade.layers?.map(l => ({ id: '', ...l, lotSize: String(l.lotSize), entryPrice: String(l.entryPrice), closingPrice: String(l.closingPrice), stopLoss: String(l.stopLoss), takeProfit: String(l.takeProfit) })) || []}
            initialPartials={layersDialogTrade.partials?.map(p => ({ id: '', ...p, lotSize: String(p.lotSize), price: String(p.price) })) || []}
            onConfirm={() => {}} // Read-only, so no-op
        />
      )}

        <AlertDialog open={!!tradeToDelete} onOpenChange={(open) => !open && setTradeToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will move the trade on {tradeToDelete?.openDate} to the trash.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setTradeToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>Move to Trash</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
    </TooltipProvider>
  );
}

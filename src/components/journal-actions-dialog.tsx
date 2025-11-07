
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useJournalStore } from '@/hooks/use-journal-store';
import { useToast } from '@/hooks/use-toast';
import { FileUp, Landmark, ShieldCheck, DollarSign, Download, LogOut, CheckCircle, Pencil, Trash2, Import, Search, BookCopy, SwitchCamera, PlusCircle, Calendar as CalendarIcon, MoreVertical } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import dynamic from 'next/dynamic';
import ProfitSplitter from './profit-splitter';
import JournalRules from './journal-rules';
import type { Journal, Transaction, JournalType } from '@/types';
import FormattedNumber from './ui/formatted-number';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter as AlertDialogFooterComponent, AlertDialogHeader, AlertDialogTitle as AlertDialogTitleComponent, AlertDialogTrigger } from './ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Combobox } from './ui/combobox';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { ScrollArea } from './ui/scroll-area';

const ImportExportDialog = dynamic(() => import('./import-export-dialog'));

const getJournalTypeGradient = (type: JournalType) => {
    switch(type) {
        case 'Real': return 'from-blue-500/20 to-cyan-500/20';
        case 'Funded': return 'from-purple-500/20 to-violet-500/20';
        case 'Demo': return 'from-gray-500/20 to-gray-600/20';
        case 'Competition': return 'from-amber-500/20 to-yellow-500/20';
        case 'Backtest': return 'from-green-500/20 to-emerald-500/20';
        default: return 'bg-muted/50';
    }
}

const CreateJournalForm = ({ onCreated }: { onCreated: () => void }) => {
    const { createJournal } = useJournalStore();
    const [newJournalTitle, setNewJournalTitle] = useState('');
    const [newJournalType, setNewJournalType] = useState<JournalType>('Real');
    const [initialDeposit, setInitialDeposit] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [comment, setComment] = useState('Initial Deposit');
    const { toast } = useToast();

    const handleDepositChange = (value: string) => {
        let cleanValue = value.replace(/[^0-9.]/g, '');
        const parts = cleanValue.split('.');
        if (parts.length > 2) {
            cleanValue = parts[0] + '.' + parts.slice(1).join('');
        }
        setInitialDeposit(cleanValue);
    };

    const handleCreateJournal = () => {
        if (!newJournalTitle || !initialDeposit) {
            toast({
                title: 'Missing Information',
                description: 'Please provide a title and initial deposit.',
                variant: 'destructive',
            });
            return;
        }
        const deposit = parseFloat(initialDeposit);
        if (isNaN(deposit) || deposit <= 0) {
            toast({
                title: 'Invalid Deposit',
                description: 'Initial deposit must be a positive number.',
                variant: 'destructive',
            });
            return;
        }
        createJournal(newJournalTitle, newJournalType, deposit, date, comment);
        toast({
            title: 'Journal Created',
            description: `Your new journal "${newJournalTitle}" is ready.`,
        });
        onCreated();
    };

    return (
        <Card className="glassmorphic bg-glass-teal">
            <CardHeader><CardTitle className="text-base">Create New Journal</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs">
                <div>
                    <Label className="text-xs">Title</Label>
                    <Input className="h-7" value={newJournalTitle} onChange={(e) => setNewJournalTitle(e.target.value)} />
                </div>
                 <div>
                    <Label className="text-xs">Type</Label>
                     <Combobox 
                        options={[
                          { value: "Real", label: "Real" },
                          { value: "Demo", label: "Demo" },
                          { value: "Backtest", label: "Backtest" },
                          { value: "Funded", label: "Funded" },
                          { value: "Competition", label: "Competition" },
                          { value: "Other", label: "Other" }
                        ]}
                        value={newJournalType}
                        onChange={(value) => setNewJournalType(value as JournalType)}
                        className="h-7"
                      />
                </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label className="text-xs">Initial Deposit</Label>
                        <Input type="text" className="h-7" value={initialDeposit} onChange={(e) => handleDepositChange(e.target.value)} />
                    </div>
                     <div>
                        <Label className="text-xs">Deposit Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-7 text-xs", !date && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-3 w-3 text-muted-foreground" />
                                    {date ? format(new Date(date + 'T00:00:00'), 'dd/MM/yyyy') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={new Date(date + 'T00:00:00')} onSelect={(d) => setDate(d ? format(d, 'yyyy-MM-dd') : '')} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                </div>
                 <div>
                    <Label className="text-xs">Comment</Label>
                    <Input className="h-7" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g., Initial funding" />
                </div>
                <Button onClick={handleCreateJournal} size="sm" className="w-full">Create Journal</Button>
            </CardContent>
        </Card>
    )
}

const DeleteJournalDialog = ({ journal, onDeleted, onOpenChange, open }: { journal: Journal; onDeleted: () => void, open: boolean, onOpenChange: (open: boolean) => void }) => {
    const { deleteJournal } = useJournalStore();
    const { toast } = useToast();
    const [confirmText, setConfirmText] = useState('');

    useEffect(() => {
        if (!open) {
            setConfirmText('');
        }
    }, [open]);

    const handleDelete = () => {
        if (confirmText.toLowerCase() === 'delete') {
            deleteJournal(journal.id);
            toast({ title: 'Journal Deleted', description: `Journal "${journal.title}" has been permanently deleted.` });
            onDeleted();
            onOpenChange(false);
        } else {
            toast({ title: 'Confirmation Failed', description: 'Please type "delete" to confirm.', variant: 'destructive' });
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitleComponent>Are you absolutely sure?</AlertDialogTitleComponent>
                    <AlertDialogDescription>
                        This will permanently delete the journal "{journal.title}" and all its data. This action cannot be undone. Please type <strong className="text-destructive">delete</strong> to confirm.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                    <Input 
                        placeholder='Type "delete" to confirm'
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                    />
                </div>
                <AlertDialogFooterComponent>
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={confirmText.toLowerCase() !== 'delete'}>Delete</AlertDialogAction>
                </AlertDialogFooterComponent>
            </AlertDialogContent>
        </AlertDialog>
    );
};


const JournalSelectorTab = () => {
    const { journals, activeJournalId, setActiveJournal, updateActiveJournal, importJournal } = useJournalStore();
    const [filter, setFilter] = useState('');
    const [showCreate, setShowCreate] = useState(journals.length === 0);
    const [editingJournal, setEditingJournal] = useState<{ id: string; title: string } | null>(null);
    const [journalToDelete, setJournalToDelete] = useState<Journal | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const router = useRouter();


    const filteredJournals = journals.filter(j => j.title.toLowerCase().includes(filter.toLowerCase()));

    const handleSelectJournal = (journalId: string) => {
        setActiveJournal(journalId);
    }
    
    const handleStartEditing = (e: React.MouseEvent, journal: Journal) => {
        e.stopPropagation(); 
        setEditingJournal({ id: journal.id, title: journal.title });
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (editingJournal) {
            setEditingJournal({ ...editingJournal, title: e.target.value });
        }
    };
    
    const handleSaveTitle = () => {
        if (!editingJournal) return;
        const journalToUpdate = journals.find(j => j.id === editingJournal.id);
        if (journalToUpdate && editingJournal.title.trim()) {
            updateActiveJournal({ ...journalToUpdate, title: editingJournal.title.trim() });
            toast({ title: 'Journal Renamed', description: `Journal was renamed to "${editingJournal.title.trim()}".` });
        }
        setEditingJournal(null);
    }
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveTitle();
        else if (e.key === 'Escape') setEditingJournal(null);
    }

    const handleExport = (e: React.MouseEvent, journal: Journal) => {
        e.stopPropagation();
        const dataStr = JSON.stringify(journal, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `${journal.title.replace(/[^a-z0-9]/gi, '_')}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        toast({ title: 'Export Successful', description: `Journal "${journal.title}" has been downloaded.` });
    }

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    if (data.id && data.title && Array.isArray(data.trades)) {
                         importJournal(data);
                        toast({ title: 'Import Successful', description: `Journal "${data.title}" has been imported.` });
                    } else {
                        throw new Error("Invalid journal file format. The file must be a previously exported journal.");
                    }
                } catch (err: any) {
                    toast({ title: 'Import Failed', description: err.message || "Could not parse the journal file.", variant: "destructive" });
                }
            };
            reader.readAsText(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };


    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search journals..." className="pl-8 h-8" value={filter} onChange={e => setFilter(e.target.value)} />
                </div>
                <Button onClick={() => setShowCreate(true)} variant="outline" size="sm" className="text-xs h-8"><PlusCircle className="mr-2 h-4 w-4"/> New</Button>
            </div>
            
            {showCreate ? (
                 <CreateJournalForm onCreated={() => setShowCreate(false)} />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {filteredJournals.map(journal => (
                        <Card 
                            key={journal.id} 
                            className={cn(
                                "p-3 flex flex-col justify-between items-center cursor-pointer glassmorphic interactive-card aspect-square bg-gradient-to-br", 
                                getJournalTypeGradient(journal.type),
                                journal.id === activeJournalId && "ring-2 ring-primary"
                            )}
                            onClick={() => handleSelectJournal(journal.id)}
                        >
                             <div className="w-full flex justify-end">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent onClick={e => e.stopPropagation()}>
                                        <DropdownMenuItem onClick={(e) => handleStartEditing(e, journal)}><Pencil className="mr-2 h-4 w-4"/> Rename</DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => handleExport(e, journal)}><Download className="mr-2 h-4 w-4"/> Export</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive" onSelect={() => setJournalToDelete(journal)}><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                             </div>
                            
                            {editingJournal?.id === journal.id ? (
                                <Input 
                                    value={editingJournal.title}
                                    onChange={handleTitleChange}
                                    onBlur={handleSaveTitle}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                    className="h-8 text-center"
                                    onClick={e => e.stopPropagation()}
                                />
                            ) : (
                                <div className="text-center">
                                    <h4 className="font-semibold text-sm line-clamp-2">{journal.title}</h4>
                                    <p className="text-xs text-muted-foreground">({journal.type})</p>
                                </div>
                            )}

                             <div className="text-center">
                                <p className="text-xs text-muted-foreground">Balance</p>
                                <div className="text-base font-bold"><FormattedNumber value={journal.balance} /></div>
                            </div>
                        </Card>
                    ))}
                     <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileImport} />
                     <Card onClick={() => fileInputRef.current?.click()} className="glassmorphic interactive-card aspect-square flex flex-col items-center justify-center cursor-pointer border-dashed">
                        <FileUp className="h-8 w-8 text-muted-foreground"/>
                        <p className="text-xs mt-2 text-muted-foreground">Import Journal</p>
                     </Card>
                </div>
            )}
            {journalToDelete && (
                <DeleteJournalDialog
                    journal={journalToDelete}
                    open={!!journalToDelete}
                    onOpenChange={() => setJournalToDelete(null)}
                    onDeleted={() => {
                        // After deleting, if there are no journals left, show the create form.
                        if (journals.length === 1) { // It will be 0 after deletion
                           setShowCreate(true);
                        }
                    }}
                />
            )}
        </div>
    )
}

const TransactionsTab = () => {
    const { journals, activeJournalId, recordDeposit, recordWithdrawal } = useJournalStore();
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    const { toast } = useToast();
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');
    const [activeTxType, setActiveTxType] = useState<'deposit' | 'withdrawal' | null>(null);

    if (!activeJournal) return null;

    const numericAmount = parseFloat(amount) || 0;
    const afterDepositBalance = activeJournal.balance + numericAmount;
    const afterWithdrawalBalance = activeJournal.balance - numericAmount;

    const handleAmountChange = (value: string) => {
        let cleanValue = value.replace(/[^0-9.]/g, '');
        const parts = cleanValue.split('.');
        if (parts.length > 2) {
            cleanValue = parts[0] + '.' + parts.slice(1).join('');
        }
        setAmount(cleanValue);
    };

    const handleTransaction = () => {
        if (!activeTxType) {
            toast({ title: 'Select Transaction Type', description: 'Please select "Deposit" or "Withdrawal".', variant: 'destructive' });
            return;
        }
        const transactionAmount = parseFloat(amount);
        if (isNaN(transactionAmount) || transactionAmount <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a positive number.", variant: "destructive" });
            return;
        }
        if (!date) {
            toast({ title: "Invalid Date", description: "Please select a valid date.", variant: "destructive" });
            return;
        }
        if (activeTxType === 'withdrawal' && transactionAmount > activeJournal.balance) {
            toast({ title: "Insufficient Funds", description: "Withdrawal amount cannot be greater than the current balance.", variant: "destructive" });
            return;
        }

        if (activeTxType === 'deposit') {
            recordDeposit(transactionAmount, date, note);
            toast({ title: "Success", description: `Successfully deposited ${amount}.` });
        } else {
            recordWithdrawal(transactionAmount, date, note);
            toast({ title: "Success", description: `Successfully withdrew ${amount}.` });
        }
        setAmount('');
        setNote('');
        setActiveTxType(null);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-4 h-full">
            <ScrollArea className="h-full">
            <div className="space-y-4 flex flex-col pr-4">
                <Card className="glassmorphic">
                    <CardContent className="p-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center p-1 rounded-md bg-muted/50">
                            <p className="text-xs text-muted-foreground">Current Balance</p>
                            <div className="text-base font-bold"><FormattedNumber value={activeJournal.balance} /></div>
                        </div>
                        <div className="text-center p-1 rounded-md bg-muted/50">
                            <p className="text-xs text-muted-foreground">Total Capital</p>
                            <div className="text-base font-bold"><FormattedNumber value={activeJournal.capital} /></div>
                        </div>
                    </CardContent>
                </Card>
                 <Card className="glassmorphic">
                    <CardHeader className="p-3"><CardTitle className="text-base">Record Transaction</CardTitle></CardHeader>
                    <CardContent className="p-3 pt-0 space-y-3 text-xs">
                        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                             <div className="grid grid-cols-3 gap-1">
                                <div><Label>Amount</Label><Input type="text" placeholder="$" value={amount} onChange={(e) => handleAmountChange(e.target.value)} className="h-7"/></div>
                                <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-7"/></div>
                                <div><Label>Note</Label><Input placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} className="h-7"/></div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <Button size="sm" onClick={() => setActiveTxType('deposit')} className="w-full h-8" variant={activeTxType === 'deposit' ? 'default' : 'outline'}>Deposit</Button>
                             <Button size="sm" onClick={() => setActiveTxType('withdrawal')} className="w-full h-8" variant={activeTxType === 'withdrawal' ? 'destructive' : 'outline'}>Withdraw</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="text-center p-1 rounded-md bg-green-500/10">
                                <p className="text-xs text-green-400">After Deposit</p>
                                <div className="text-sm font-bold"><FormattedNumber value={afterDepositBalance} /></div>
                            </div>
                            <div className="text-center p-1 rounded-md bg-red-500/10">
                                <p className="text-xs text-red-400">After Withdrawal</p>
                                <div className="text-sm font-bold"><FormattedNumber value={afterWithdrawalBalance} /></div>
                            </div>
                        </div>
                        <Button onClick={handleTransaction} disabled={!activeTxType} className="w-full">Confirm {activeTxType}</Button>
                    </CardContent>
                </Card>
            </div>
            </ScrollArea>
            <Card className="glassmorphic h-full flex flex-col">
                <CardHeader className="p-3"><CardTitle className="text-base">Transaction History</CardTitle></CardHeader>
                <CardContent className="p-0 flex-1 min-h-0">
                    <ScrollArea className="h-full">
                        <Table className="text-xs">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="p-2 text-xs">Date</TableHead>
                                    <TableHead className="p-2 text-xs">Type</TableHead>
                                    <TableHead className="p-2 text-xs">Note</TableHead>
                                    <TableHead className="text-right p-2 text-xs">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeJournal.transactions && activeJournal.transactions.length > 0 ? (
                                    [...activeJournal.transactions]
                                    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="p-2">{format(new Date(tx.date + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="p-2">
                                            <span className={tx.type === 'Deposit' ? 'text-green-500' : 'text-red-500'}>{tx.type}</span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground p-2">{tx.note}</TableCell>
                                        <TableCell className="text-right p-2"><FormattedNumber value={tx.amount} /></TableCell>
                                    </TableRow>
                                ))) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground p-4">No transactions recorded yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}

const JournalActionsDialogContent = () => {
    const { journals, activeJournalId } = useJournalStore();
    const activeJournal = React.useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    
    if (!activeJournal) return null;

    return (
        <Tabs defaultValue="journals" className="w-full flex-1 min-h-0 flex flex-col text-xs">
            <TabsList className="grid w-full grid-cols-4 h-auto text-xs">
                <TabsTrigger value="journals" className="h-8"><SwitchCamera className="mr-2 h-4 w-4"/>Journals</TabsTrigger>
                <TabsTrigger value="transactions" className="h-8"><Landmark className="mr-2 h-4 w-4"/>Transactions</TabsTrigger>
                <TabsTrigger value="profit-splitter" className="h-8"><DollarSign className="mr-2 h-4 w-4"/>Profit Splitter</TabsTrigger>
                <TabsTrigger value="funded-rules" className="h-8"><ShieldCheck className="mr-2 h-4 w-4"/>Funded Rules</TabsTrigger>
            </TabsList>
            <div className="py-2 flex-1 min-h-0 overflow-y-auto">
                <TabsContent value="journals">
                    <JournalSelectorTab />
                </TabsContent>
                <TabsContent value="transactions" className="h-full">
                   <TransactionsTab />
                </TabsContent>
                <TabsContent value="profit-splitter" className="h-full">
                    <ProfitSplitter journal={activeJournal} />
                </TabsContent>
                <TabsContent value="funded-rules" className="h-full">
                    <JournalRules journal={activeJournal} />
                </TabsContent>
            </div>
        </Tabs>
    );
};

interface JournalActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JournalActionsDialog = ({ open, onOpenChange }: JournalActionsDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glassmorphic sm:max-w-6xl h-[90vh] flex flex-col p-2">
                <DialogHeader className="p-2">
                    <DialogTitle className="text-base">Journal Management</DialogTitle>
                </DialogHeader>
                <JournalActionsDialogContent />
            </DialogContent>
        </Dialog>
    )
}

export default JournalActionsDialog;

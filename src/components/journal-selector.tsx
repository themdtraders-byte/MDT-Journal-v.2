
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useJournalStore } from '@/hooks/use-journal-store';
import { JournalType, Trade } from '@/types';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { PlusCircle, FileUp, Calendar as CalendarIcon } from 'lucide-react';
import ImportExportDialog from './import-export-dialog';
import FormattedNumber from './ui/formatted-number';
import { Combobox } from './ui/combobox';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';


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

const JournalSelector = () => {
  const router = useRouter();
  const { journals, createJournal, importJournal, setActiveJournal } = useJournalStore(state => ({
      journals: state.journals,
      createJournal: state.createJournal,
      importJournal: state.importJournal,
      setActiveJournal: state.setActiveJournal,
  }));

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('My First Journal');
  const [type, setType] = useState<JournalType>('Real');
  const [deposit, setDeposit] = useState('10000');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [comment, setComment] = useState('Initial Deposit');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (journals.length === 0) {
      setShowCreate(true);
    }
  }, [journals.length]);

  const handleDepositChange = (value: string) => {
    let cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }
    setDeposit(cleanValue);
  }

  const handleSelectJournal = (journalId: string) => {
    setActiveJournal(journalId);
    router.replace('/home');
  }

  const handleCreate = () => {
    if (!title.trim() || !deposit.trim()) {
      toast({ title: 'Missing Fields', description: 'Please provide a title and initial deposit.', variant: 'destructive' });
      return;
    }
    const depositAmount = parseFloat(deposit);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({ title: 'Invalid Deposit', description: 'Initial deposit must be a positive number.', variant: 'destructive' });
      return;
    }

    createJournal(title, type, depositAmount, date, comment);
    setShowCreate(false); // Close the form after creation
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.id && data.title && Array.isArray(data.trades)) {
            importJournal(data);
            toast({ title: 'Import Successful', description: `Journal "${data.title}" has been imported and set as active.` });
          } else {
            throw new Error("Invalid journal file format. Please import a file previously exported from this application.");
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
    <>
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-[90vw] max-w-lg glassmorphic">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Welcome to MD Journal</CardTitle>
            <CardDescription>Select a journal to continue or create a new one.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {journals.length > 0 && !showCreate && (
              <div className="space-y-2">
                  {journals.map(journal => (
                      <Card 
                          key={journal.id} 
                          className={cn("p-4 flex justify-between items-center cursor-pointer glassmorphic interactive-card bg-gradient-to-br", getJournalTypeGradient(journal.type))}
                          onClick={() => handleSelectJournal(journal.id)}
                      >
                          <div>
                            <h4 className="font-semibold">{journal.title} <span className="text-xs text-muted-foreground">({journal.type})</span></h4>
                            <div className="text-sm text-muted-foreground mt-1 flex items-center">Balance: <FormattedNumber value={journal.balance} /></div>
                          </div>
                      </Card>
                  ))}
              </div>
            )}

            {showCreate ? (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-center">Create New Journal</h3>
                <div>
                  <Label htmlFor="j-title">Journal Title</Label>
                  <Input id="j-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., My Prop Firm Journal" />
                </div>
                <div>
                  <Label htmlFor="j-type">Journal Type</Label>
                  <Combobox
                    options={[
                      { value: "Real", label: "Real" },
                      { value: "Demo", label: "Demo" },
                      { value: "Backtest", label: "Backtest" },
                      { value: "Funded", label: "Funded" },
                      { value: "Competition", label: "Competition" },
                      { value: "Other", label: "Other" }
                    ]}
                    value={type}
                    onChange={(v) => setType(v as JournalType)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="j-deposit">Initial Deposit (USD)</Label>
                    <Input id="j-deposit" type="text" value={deposit} onChange={(e) => handleDepositChange(e.target.value)} placeholder="e.g., 10000" />
                  </div>
                  <div>
                    <Label htmlFor="j-date">Deposit Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-10", !date && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(new Date(date), "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={new Date(date)}
                                onSelect={(d) => setDate(d ? format(d, 'yyyy-MM-dd') : '')}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div>
                  <Label htmlFor="j-comment">Comment</Label>
                  <Input id="j-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g., Initial funding" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleCreate} className="w-full">Create and Start Journaling</Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileImport} />
                    <Button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto" variant="secondary">
                        <FileUp className="mr-2 h-4 w-4" />
                        Import
                    </Button>
                </div>
                {journals.length > 0 && <Button variant="link" onClick={() => setShowCreate(false)}>Cancel</Button>}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                  <Button onClick={() => setShowCreate(true)} className="w-full" variant="outline">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create New Journal
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileImport} />
                  <Button onClick={() => fileInputRef.current?.click()} className="w-full" variant="outline">
                      <FileUp className="mr-2 h-4 w-4" />
                      Import Journal
                  </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ImportExportDialog open={isImportOpen} onOpenChange={setIsImportOpen} trades={[]} selectedTrades={[]} />
    </>
  );
};

export default JournalSelector;

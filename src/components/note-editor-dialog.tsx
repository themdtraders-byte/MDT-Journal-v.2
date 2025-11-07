
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { Note, Trade } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Check, ChevronsUpDown, Link as LinkIcon, X, Edit } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import RichTextEditor from './rich-text-editor';
import { Switch } from './ui/switch';
import { Combobox } from './ui/combobox';
import TradeDetailDialog from './trade-detail-dialog';

interface NoteEditorDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  note: Note | null;
  onSave: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> | Note) => void;
  initialFolderId?: string;
  isReadOnly?: boolean;
}

const tagColors = [
    'bg-blue-500/20 text-blue-300',
    'bg-green-500/20 text-green-300',
    'bg-purple-500/20 text-purple-300',
    'bg-yellow-500/20 text-yellow-300',
    'bg-pink-500/20 text-pink-300',
    'bg-orange-500/20 text-orange-300',
    'bg-cyan-500/20 text-cyan-300',
];

const getStatusBadgeVariant = (status: Note['status']) => {
    switch (status) {
        case 'Idea': return 'bg-blue-500/20 text-blue-400';
        case 'Researching': return 'bg-yellow-500/20 text-yellow-500';
        case 'Executing': return 'bg-purple-500/20 text-purple-400';
        case 'Completed': return 'bg-green-500/20 text-green-500';
        default: return 'bg-gray-500/20 text-gray-500';
    }
}

const NoteEditorDialog = ({ isOpen, setIsOpen, note, onSave, initialFolderId = 'unfiled', isReadOnly = false }: NoteEditorDialogProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<Note['status']>('Idea');
  const [linkedTradeIds, setLinkedTradeIds] = useState<string[]>([]);
  const [autoSave, setAutoSave] = useState(false);
  const [folderId, setFolderId] = useState<string>(initialFolderId);
  const [isEditingMode, setIsEditingMode] = useState(!isReadOnly);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);


  const { toast } = useToast();
  const { activeJournal, addNoteFolder } = useJournalStore(state => ({
      activeJournal: state.journals.find(j => j.id === state.activeJournalId),
      addNoteFolder: state.addNoteFolder,
  }));
  const [comboOpen, setComboOpen] = useState(false);

  const trades = useMemo(() => activeJournal?.trades || [], [activeJournal]);
  const folders = useMemo(() => activeJournal?.noteFolders || [], [activeJournal]);

  useEffect(() => {
    if (isOpen) {
      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setTags(note.tags.join(', '));
        setStatus(note.status);
        setLinkedTradeIds(note.linkedTradeIds || []);
        setFolderId(note.folderId || 'unfiled');
      } else {
        // Reset form for new note
        setTitle('');
        setContent('');
        setTags('');
        setStatus('Idea');
        setLinkedTradeIds([]);
        setFolderId(initialFolderId);
      }
      setIsEditingMode(!isReadOnly || !note); // Enable editing for new notes
      setAutoSave(false);
    } else {
        setViewingTrade(null); // Clear viewing trade when dialog closes
    }
  }, [note, isOpen, initialFolderId, isReadOnly]);

   // Auto-save logic
  useEffect(() => {
    if (!isOpen || !autoSave || !isEditingMode || !note?.id) return;
    const timeoutId = setTimeout(() => {
      handleSave(true); // silent save
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [title, content, tags, status, linkedTradeIds, folderId, autoSave, isOpen, note?.id, isEditingMode]);


  const handleSave = (isAutoSave = false) => {
    if (!title.trim() && !isAutoSave) {
      toast({
        title: 'Title is required',
        description: 'Please provide a title for your note.',
        variant: 'destructive',
      });
      return;
    }

    const noteData = {
      title,
      content,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      status,
      linkedTradeIds,
      folderId
    };
    
    onSave(note ? { ...note, ...noteData } : noteData as Omit<Note, 'id' | 'createdAt' | 'updatedAt'>);
    
    if(!isAutoSave) {
      setIsOpen(false);
    }
  };
  
  const handleCreateFolder = (newFolderName: string) => {
    if(newFolderName && !folders.some(f => f.name === newFolderName)) {
        const newFolderId = addNoteFolder(newFolderName);
        setFolderId(newFolderId);
    }
  }

  const handleTradeSelect = (tradeId: string) => {
    setLinkedTradeIds(prev =>
      prev.includes(tradeId)
        ? prev.filter(id => id !== tradeId)
        : [...prev, tradeId]
    );
  };
  
  const getTradeLabel = (trade: Trade) => {
    if (!trade.auto || typeof trade.auto.pl !== 'number') {
        return `${trade.openDate} | ${trade.pair} | ${trade.direction} | P/L N/A`;
    }
    return `${trade.openDate} | ${trade.pair} | ${trade.direction} | ${trade.auto.pl >= 0 ? '+' : ''}$${trade.auto.pl.toFixed(2)}`;
  }

  const folderOptions = useMemo(() => [
      { value: 'unfiled', label: 'Unfiled' },
      ...folders.map(f => ({ value: f.id, label: f.name }))
  ], [folders]);

  // --- READ-ONLY VIEW ---
  if (isReadOnly && !isEditingMode && note) {
    return (
      <>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="glassmorphic sm:max-w-4xl h-[90vh] flex flex-col p-4">
            <DialogHeader className="p-2 border-b">
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl">{note.title}</DialogTitle>
                <Button variant="outline" size="sm" onClick={() => setIsEditingMode(true)}>
                  <Edit className="mr-2 h-4 w-4"/> Edit Note
                </Button>
              </div>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
                <RichTextEditor
                    value={note.content}
                    onChange={() => {}}
                    isEditable={false}
                />
            </div>
            <DialogFooter className="p-2 border-t flex-col sm:flex-col items-start gap-3">
                <div className="flex items-center gap-2">
                    <Label className="text-xs">Status:</Label>
                    <Badge className={getStatusBadgeVariant(note.status)}>{note.status}</Badge>
                </div>
                 {note.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <Label className="text-xs">Tags:</Label>
                        {note.tags.map((tag, index) => (
                            <Badge key={tag} className={cn("text-[10px]", tagColors[index % tagColors.length])}>{tag}</Badge>
                        ))}
                    </div>
                 )}
                 {note.linkedTradeIds && note.linkedTradeIds.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                         <Label className="text-xs">Linked Trades:</Label>
                         {note.linkedTradeIds.map(id => {
                            const trade = trades.find(t => t.id === id);
                            if (!trade) return null;
                            return (
                                <Button key={id} size="xs" variant="secondary" onClick={() => setViewingTrade(trade)}>
                                    {getTradeLabel(trade)}
                                </Button>
                            );
                         })}
                    </div>
                 )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {viewingTrade && (
            <TradeDetailDialog
                trade={viewingTrade}
                isOpen={!!viewingTrade}
                onOpenChange={(open) => !open && setViewingTrade(null)}
            />
        )}
      </>
    );
  }

  // --- EDITING VIEW (Original Logic) ---
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="glassmorphic sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center">
             <DialogTitle>{isReadOnly && !isEditingMode ? 'View Note' : (note?.id ? 'Edit Note' : 'Create New Note')}</DialogTitle>
            <div className="flex items-center gap-2">
                 {isEditingMode && (
                    <div className="flex items-center gap-2">
                        <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
                        <Label htmlFor="auto-save" className="text-sm">Auto-save</Label>
                    </div>
                )}
            </div>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-x-8 flex-1 min-h-0">
            {/* Main Content Area */}
            <div className="col-span-3 flex flex-col gap-4 h-full min-h-0">
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title..."
                  className="text-2xl font-bold h-auto p-2 border-0 shadow-none focus-visible:ring-0 flex-shrink-0"
                  readOnly={!isEditingMode}
                />
                 <div className="flex-1 min-h-0">
                    <RichTextEditor value={content} onChange={setContent} isEditable={isEditingMode} />
                 </div>
            </div>

            {/* Sidebar */}
            <div className="col-span-1 space-y-4 overflow-y-auto p-1">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v: Note['status']) => setStatus(v)} disabled={!isEditingMode}>
                      <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Idea">Idea</SelectItem>
                          <SelectItem value="Researching">Researching</SelectItem>
                          <SelectItem value="Executing">Executing</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
                 <div>
                    <Label htmlFor="folder">Folder</Label>
                    <Combobox
                        options={folderOptions}
                        value={folderId}
                        onChange={setFolderId}
                        placeholder="Select a folder..."
                        onAddNew={handleCreateFolder}
                        disabled={!isEditingMode}
                    />
                 </div>
                 <div>
                    <Label htmlFor="tags">Tags</Label>
                     <Input
                        id="tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="e.g. analysis, risk"
                        readOnly={!isEditingMode}
                    />
                 </div>

                 <div>
                    <Label>Link Trades</Label>
                    <Popover open={comboOpen} onOpenChange={setComboOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={comboOpen} className="w-full justify-between" disabled={!isEditingMode}>
                                <span className="flex items-center">
                                    <LinkIcon className="mr-2 h-5 w-5" />
                                    {linkedTradeIds.length > 0 ? `${linkedTradeIds.length} linked` : "Select trades..."}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput placeholder="Search trades..." className="h-9" />
                                <CommandEmpty>No trades found.</CommandEmpty>
                                <CommandGroup>
                                    <ScrollArea className="h-48">
                                    {trades.map((trade) => (
                                        <CommandItem
                                            key={trade.id}
                                            value={trade.id}
                                            onSelect={() => handleTradeSelect(trade.id)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    linkedTradeIds.includes(trade.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {getTradeLabel(trade)}
                                        </CommandItem>
                                    ))}
                                    </ScrollArea>
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                 </div>
                 {linkedTradeIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {linkedTradeIds.map(id => {
                            const trade = trades.find(t => t.id === id);
                            return trade ? (
                                <Badge key={id} variant="secondary" className="pr-1">
                                    {getTradeLabel(trade)}
                                    <button onClick={() => isEditingMode && handleTradeSelect(id)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 disabled:cursor-not-allowed" disabled={!isEditingMode}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ) : null;
                        })}
                    </div>
                 )}
            </div>
        </div>
        <DialogFooter>
          {isEditingMode ? (
              <>
                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" onClick={() => handleSave()}>Save Note</Button>
              </>
          ) : (
             <Button type="button" onClick={() => setIsOpen(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NoteEditorDialog;

    
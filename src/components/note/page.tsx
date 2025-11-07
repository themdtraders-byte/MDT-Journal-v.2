
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  PlusCircle,
  Search,
  MoreVertical,
  LayoutGrid,
  List,
  Eye,
  Trash2,
  Copy,
  FolderSymlink,
  Tag,
  X,
  Edit,
} from 'lucide-react';
import type { Note, NoteFolder } from '@/types';
import NoteEditorDialog from '@/components/note-editor-dialog';
import NoteCard from '@/components/note-card';
import { useToast } from '@/hooks/use-toast';
import { useHasHydrated } from '@/hooks/use-has-hydrated';
import NoteListItem from '@/components/note-list-item';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Notebook } from '@/components/icons/flat/Notebook';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';


const NotesPage = () => {
  const { 
      activeJournal, addNote, updateNote, deleteNote, addNoteFolder, updateNoteFolder, deleteNoteFolder, 
      deleteNotes, duplicateNotes, moveNotesToFolder, addTagsToNotes
  } = useJournalStore(state => ({
    activeJournal: state.journals.find(j => j.id === state.activeJournalId),
    addNote: state.addNote,
    updateNote: state.updateNote,
    deleteNote: state.deleteNote,
    addNoteFolder: state.addNoteFolder,
    updateNoteFolder: state.updateNoteFolder,
    deleteNoteFolder: state.deleteNoteFolder,
    deleteNotes: state.deleteNotes,
    duplicateNotes: state.duplicateNotes,
    moveNotesToFolder: state.moveNotesToFolder,
    addTagsToNotes: state.addTagsToNotes,
  }));
  const { toast } = useToast();
  
  const notes = activeJournal?.notes || [];
  const folders = useMemo(() => [{id: 'all', name: 'All Notes'}, {id: 'unfiled', name: 'Unfiled'}, ...(activeJournal?.noteFolders || [])], [activeJournal?.noteFolders]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [readingNote, setReadingNote] = useState<Note | null>(null);

  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState('');
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [isMovePopoverOpen, setIsMovePopoverOpen] = useState(false);

  const hasHydrated = useHasHydrated();
  
  const [editingFolder, setEditingFolder] = useState<{ id: string; name: string } | null>(null);

  const handleStartEditingFolder = (e: React.MouseEvent, folderId: string, currentName: string) => {
    e.stopPropagation();
    setEditingFolder({ id: folderId, name: currentName });
  };
  
  const handleSaveFolderName = () => {
    if (editingFolder && editingFolder.name.trim()) {
      updateNoteFolder(editingFolder.id, editingFolder.name.trim());
      setEditingFolder(null);
    }
  };

  const handleCreateNewNote = () => {
    setEditingNote(null);
    setReadingNote(null);
    setIsEditorOpen(true);
  };
  
  const handleAddFolder = () => {
    const newFolderName = prompt("Enter new folder name:");
    if (newFolderName && newFolderName.trim() !== '') {
        addNoteFolder(newFolderName.trim());
    }
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setReadingNote(null);
    setIsEditorOpen(true);
  };

  const handleReadNote = (note: Note) => {
    setReadingNote(note);
    setEditingNote(null);
    setIsEditorOpen(true); // Re-use the same dialog component but in a read-only state
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote(noteId);
    toast({ title: 'Note Deleted', description: 'The note has been moved to the trash.' });
  };

  const handleSaveNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> | Note) => {
    if ('id' in noteData && noteData.id) {
      updateNote(noteData as Note);
      toast({ title: 'Note Updated' });
    } else {
      const finalNoteData = {
          ...noteData,
          folderId: activeFolderId !== 'all' && activeFolderId !== 'unfiled' ? activeFolderId : undefined
      };
      addNote(finalNoteData);
      toast({ title: 'Note Created' });
    }
  };

  const filteredNotes = useMemo(() => {
      let filtered = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      if (activeFolderId !== 'all') {
          filtered = filtered.filter(note => note.folderId === activeFolderId || (activeFolderId === 'unfiled' && !note.folderId));
      }

      if (searchTerm) {
          const lowercasedFilter = searchTerm.toLowerCase();
          filtered = filtered.filter(note => 
              note.title.toLowerCase().includes(lowercasedFilter) ||
              (note.content && note.content.toLowerCase().includes(lowercasedFilter)) ||
              (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowercasedFilter)))
          );
      }
      return filtered;
  }, [notes, searchTerm, activeFolderId]);
  
  const handleNoteSelect = (noteId: string, checked: boolean) => {
    setSelectedNoteIds(prev => {
        const newSet = new Set(prev);
        if(checked) {
            newSet.add(noteId);
        } else {
            newSet.delete(noteId);
        }
        return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedNoteIds(checked ? new Set(filteredNotes.map(n => n.id)) : new Set());
  };

  const handleBulkDelete = () => {
    deleteNotes(Array.from(selectedNoteIds));
    toast({ title: `${selectedNoteIds.size} notes moved to trash.` });
    setSelectedNoteIds(new Set());
  }

  const handleBulkDuplicate = () => {
    duplicateNotes(Array.from(selectedNoteIds));
    toast({ title: `${selectedNoteIds.size} notes duplicated.` });
    setSelectedNoteIds(new Set());
  }
  
  const handleBulkMove = (targetFolderId: string) => {
    moveNotesToFolder(Array.from(selectedNoteIds), targetFolderId);
    toast({ title: `${selectedNoteIds.size} notes moved.` });
    setSelectedNoteIds(new Set());
    setIsMovePopoverOpen(false);
  }

  const handleBulkTag = () => {
    const tagsToAdd = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    if (tagsToAdd.length > 0) {
      addTagsToNotes(Array.from(selectedNoteIds), tagsToAdd);
      toast({ title: 'Tags added successfully.' });
    }
    setTagInput('');
    setIsTagPopoverOpen(false);
  }


  if (!hasHydrated || !activeJournal) {
    return null; // Or a loading spinner
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 flex-shrink-0">
        <div>
            <h1 className="text-2xl font-bold">Notebook</h1>
            <p className="text-muted-foreground">Capture your thoughts, ideas, and trade analysis.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative flex-grow">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input 
                   placeholder="Search notes..."
                   className="pl-9"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
               />
           </div>
            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)} defaultValue="grid">
                <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4"/></ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4"/></ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={handleCreateNewNote}><PlusCircle className="mr-2 h-4 w-4" /> Create Note</Button>
        </div>
      </div>
      
       {selectedNoteIds.size > 0 && (
         <div className="flex items-center gap-2 p-2 rounded-lg bg-muted border animate-fade-in">
            <span className="text-sm font-semibold">{selectedNoteIds.size} selected</span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will move the selected {selectedNoteIds.size} note(s) to the trash.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleBulkDelete}>Move to Trash</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" size="sm" onClick={handleBulkDuplicate}><Copy className="mr-2 h-4 w-4"/>Duplicate</Button>
             <Popover open={isMovePopoverOpen} onOpenChange={setIsMovePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm"><FolderSymlink className="mr-2 h-4 w-4"/>Move</Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1">
                <Command>
                    <CommandList>
                        <CommandGroup>
                             {folders.filter(f => f.id !== 'all').map(folder => (
                                <CommandItem key={folder.id} onSelect={() => handleBulkMove(folder.id)}>
                                    {folder.name}
                                </CommandItem>
                             ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Popover open={isTagPopoverOpen} onOpenChange={setIsTagPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm"><Tag className="mr-2 h-4 w-4"/>Add Tags</Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="space-y-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBulkTag()}/>
                    <Button size="sm" className="w-full" onClick={handleBulkTag}>Apply Tags</Button>
                </div>
              </PopoverContent>
            </Popover>
             <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto" onClick={() => setSelectedNoteIds(new Set())}>
                <X className="h-4 w-4"/>
            </Button>
         </div>
       )}

      <div className="flex items-center gap-2 flex-shrink-0 border-t border-b py-2 -mx-6 px-6">
            {folders.map(folder => {
                const isEditing = editingFolder?.id === folder.id;
                return (
                 <div key={folder.id} className="relative group">
                    <Button 
                        variant={activeFolderId === folder.id ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setActiveFolderId(folder.id)}
                        className="pr-7"
                    >
                         {isEditing ? (
                            <Input 
                                value={editingFolder.name} 
                                onChange={e => setEditingFolder({...editingFolder, name: e.target.value})} 
                                onBlur={handleSaveFolderName} 
                                onKeyDown={e => e.key === 'Enter' && handleSaveFolderName()}
                                autoFocus
                                className="h-6 text-sm"
                                onClick={e => e.stopPropagation()}
                            />
                        ) : (
                            folder.name
                        )}
                    </Button>
                    {!isEditing && !['all', 'unfiled'].includes(folder.id) && (
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 absolute top-1/2 right-0.5 -translate-y-1/2 opacity-0 group-hover:opacity-100">
                                    <MoreVertical className="h-3 w-3"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={(e) => handleStartEditingFolder(e, folder.id, folder.name)}>
                                    <Edit className="mr-2 h-4 w-4" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteNoteFolder(folder.id)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                 </div>
            )})}
        </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-4">
        {filteredNotes.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredNotes.map((note, index) => (
                  <NoteCard 
                    key={note.id} note={note} onEdit={handleEditNote} onDelete={handleDeleteNote} onRead={handleReadNote}
                    isSelected={selectedNoteIds.has(note.id)}
                    onSelect={handleNoteSelect}
                 />
              ))}
            </div>
          ) : (
             <div className="border rounded-lg">
                <div className="flex items-center p-2 border-b">
                    <Checkbox
                        id="select-all-list"
                        checked={selectedNoteIds.size === filteredNotes.length && filteredNotes.length > 0}
                        onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="select-all-list" className="ml-2">Select All</Label>
                </div>
                {filteredNotes.map(note => (
                    <NoteListItem 
                        key={note.id} note={note} onEdit={handleEditNote} onDelete={handleDeleteNote} onClick={() => handleReadNote(note)} 
                        isSelected={selectedNoteIds.has(note.id)}
                        onSelect={handleNoteSelect}
                    />
                ))}
             </div>
          )
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
              <Notebook className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold">No Notes Found</h2>
              <p className="text-muted-foreground max-w-md mx-auto mt-2">
                  Create a new note to start capturing your thoughts, or try adjusting your filters.
              </p>
            </div>
        )}
      </div>

      <NoteEditorDialog 
        isOpen={isEditorOpen} 
        setIsOpen={setIsEditorOpen}
        note={editingNote || readingNote}
        onSave={handleSaveNote}
        isReadOnly={!!readingNote}
        initialFolderId={activeFolderId === 'all' ? 'unfiled' : activeFolderId}
      />
    </div>
  );
}

export default NotesPage;

    

'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Note } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Pencil, Trash2, Link as LinkIcon } from "lucide-react";
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
import { Checkbox } from "./ui/checkbox";

interface NoteListItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onClick: () => void;
  isSelected: boolean;
  onSelect: (noteId: string, checked: boolean) => void;
}

export default function NoteListItem({ note, onEdit, onDelete, onClick, isSelected, onSelect }: NoteListItemProps) {
    
    const getStatusBadgeVariant = (status: Note['status']) => {
        switch (status) {
            case 'Idea': return 'bg-blue-500/20 text-blue-400';
            case 'Researching': return 'bg-yellow-500/20 text-yellow-500';
            case 'Executing': return 'bg-purple-500/20 text-purple-400';
            case 'Completed': return 'bg-green-500/20 text-green-500';
            default: return 'bg-gray-500/20 text-gray-500';
        }
    }
    
    const plainTextContent = (note.content || '').replace(/<[^>]+>/g, '').slice(0, 100);

  return (
    <div className="flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={onClick}>
      <div className="mr-4" onClick={e => e.stopPropagation()}>
          <Checkbox checked={isSelected} onCheckedChange={checked => onSelect(note.id, !!checked)} />
      </div>
      <div className="flex-1 flex flex-col gap-1 overflow-hidden">
        <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{note.title}</h3>
            <Badge className={getStatusBadgeVariant(note.status)}>{note.status}</Badge>
            {note.linkedTradeIds && note.linkedTradeIds.length > 0 && (
                 <span className="flex items-center text-xs text-muted-foreground">
                    <LinkIcon className="h-5 w-5 mr-1" />
                    {note.linkedTradeIds.length}
                </span>
             )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{plainTextContent}{note.content && note.content.length > 100 ? '...' : ''}</p>
        <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">
                Updated {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
            </p>
            {note.tags && note.tags.length > 0 && <span className="text-xs text-muted-foreground">|</span>}
            <div className="flex flex-wrap gap-1">
            {(note.tags || []).slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
            {note.tags && note.tags.length > 3 && <Badge variant="secondary">+{note.tags.length - 3} more</Badge>}
            </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(note); }}>
          <Pencil className="h-5 w-5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
             <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
              <Trash2 className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will move your note titled "{note.title}" to the trash.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

    
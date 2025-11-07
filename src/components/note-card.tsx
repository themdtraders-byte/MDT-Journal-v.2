

'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Note } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Pencil, Trash2, Link as LinkIcon, Eye } from "lucide-react";
import React from 'react';
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
import { cn } from "@/lib/utils";
import { Checkbox } from "./ui/checkbox";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onRead: (note: Note) => void; 
  className?: string;
  isSelected: boolean;
  onSelect: (noteId: string, checked: boolean) => void;
}

const tagColors = [
    'bg-gradient-to-tr from-blue-500/50 to-cyan-500/50',
    'bg-gradient-to-tr from-green-500/50 to-emerald-500/50',
    'bg-gradient-to-tr from-purple-500/50 to-violet-500/50',
    'bg-gradient-to-tr from-yellow-500/50 to-amber-500/50',
    'bg-gradient-to-tr from-pink-500/50 to-rose-500/50',
    'bg-gradient-to-tr from-orange-500/50 to-red-500/50',
];


const NoteCard = React.forwardRef<HTMLDivElement, NoteCardProps>(({ note, onEdit, onDelete, onRead, className, isSelected, onSelect }, ref) => {
  const getPreview = (html: string) => {
    if (typeof document === 'undefined') return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || "";
    return text.length > 80 ? text.slice(0, 80) + '...' : text;
  }
  
  return (
    <div ref={ref} className={cn("relative group", className)}>
        <Card 
          className={cn("glassmorphic interactive-card flex flex-col h-full hover:shadow-primary/20 transition-shadow cursor-pointer aspect-square", isSelected && "ring-2 ring-primary")}
          onClick={() => onRead(note)}
        >
          <div className="absolute top-2 left-2 z-10" onClick={e => e.stopPropagation()}>
             <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelect(note.id, !!checked)} />
          </div>
          <CardHeader className="p-2 pb-1 pt-8">
              <CardTitle className="text-sm font-bold line-clamp-2">{note.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-2 pt-1 overflow-hidden">
              <p className="text-[10px] text-muted-foreground line-clamp-4">
                  {getPreview(note.content)}
              </p>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-1 p-2 pt-0">
              <div className="flex flex-wrap gap-1 h-8 overflow-hidden">
                {note.tags.map((tag, index) => (
                    <div key={tag} className={cn("text-[8px] px-1 rounded-sm text-foreground", tagColors[index % tagColors.length])}>{tag}</div>
                ))}
              </div>
              <div className="w-full flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t mt-auto">
                  <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {note.linkedTradeIds && note.linkedTradeIds.length > 0 && (
                          <span className="flex items-center mr-1">
                              <LinkIcon className="h-3 w-3 mr-0.5" />
                              {note.linkedTradeIds.length}
                          </span>
                      )}
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); onEdit(note); }}><Pencil className="h-3 w-3" /></Button>
                      <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-5 w-5" onClick={(e) => e.stopPropagation()}>
                          <Trash2 className="h-3 w-3" />
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
          </CardFooter>
        </Card>
    </div>
  );
});

NoteCard.displayName = 'NoteCard';
export default NoteCard;

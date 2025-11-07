

'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Note, NoteFolder } from "@/types";
import { Folder, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";


interface NoteFolderCardProps {
  folder: NoteFolder;
  noteCount: number;
  onSelect: () => void;
  onEdit: (folderId: string, currentName: string) => void;
  onDelete: (folderId: string) => void;
  index: number;
}

const bgColors = [
    'bg-glass-blue', 'bg-glass-green', 'bg-glass-teal', 
    'bg-glass-purple', 'bg-glass-red', 'bg-glass-yellow',
    'bg-glass-cyan', 'bg-glass-orange', 'bg-glass-pink'
];


export default function NoteFolderCard({ folder, noteCount, onSelect, onEdit, onDelete, index }: NoteFolderCardProps) {
  const isUnfiled = folder.id === 'unfiled';
  const bgColor = bgColors[index % bgColors.length];

  return (
    <div className="relative group">
        <Card 
            className={cn(
                "glassmorphic interactive-card aspect-square flex flex-col hover:shadow-primary/20 transition-shadow cursor-pointer",
                bgColor
            )}
            onClick={onSelect}
        >
            <CardHeader className="flex-row items-start gap-2 p-2">
                <Folder className="h-5 w-5 text-primary flex-shrink-0" />
                <CardTitle className="text-xs font-semibold flex-1 line-clamp-2">{folder.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center p-0">
                <div className="text-center">
                    <p className="text-2xl font-bold">{noteCount}</p>
                    <p className="text-xs text-muted-foreground">Note{noteCount !== 1 && 's'}</p>
                </div>
            </CardContent>
        </Card>

        {!isUnfiled && (
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(folder.id, folder.name); }}>
                            <Pencil className="mr-2 h-4 w-4"/> Edit Name
                        </DropdownMenuItem>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Folder
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the folder "{folder.name}". Notes inside will be moved to "Unfiled".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(folder.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        )}
    </div>
  );
}

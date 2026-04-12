import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Star, Edit, Trash2 } from "lucide-react";
import type { Note } from '@/types/notes';

interface ViewNoteDialogProps {
  note: Note | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ViewNoteDialog({ note, open, onOpenChange, onEdit, onDelete }: ViewNoteDialogProps) {
  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">{note.title}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                {note.starred && (
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                )}
                <Badge variant="secondary">{note.course}</Badge>
                {note.tags?.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="bg-muted/50 p-4 rounded-lg min-h-[150px]">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {note.content || "No content"}
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Created {new Date(note.created_at).toLocaleDateString()}</span>
            </div>
            {note.updated_at !== note.created_at && (
              <span>• Updated {new Date(note.updated_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
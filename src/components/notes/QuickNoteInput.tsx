import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Send } from "lucide-react";

interface QuickNoteInputProps {
  onSave: (title: string, content: string) => Promise<void>;
}

export function QuickNoteInput({ onSave }: QuickNoteInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave(title.trim() || 'Untitled Note', content.trim());
      setTitle('');
      setContent('');
      setIsExpanded(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setTitle('');
      setContent('');
    }
    if (e.key === 'Enter' && e.metaKey) {
      handleSave();
    }
  };

  if (!isExpanded) {
    return (
      <Card 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Plus className="h-5 w-5" />
            <span>Take a quick note...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="ring-2 ring-primary/20">
      <CardContent className="p-4 space-y-3">
        <Input
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border-0 shadow-none focus-visible:ring-0 text-lg font-medium px-0"
          autoFocus
        />
        <Textarea
          placeholder="Write your note here... (⌘+Enter to save)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border-0 shadow-none focus-visible:ring-0 resize-none min-h-[100px] px-0"
          rows={4}
        />
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsExpanded(false);
              setTitle('');
              setContent('');
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || (!title.trim() && !content.trim())}
          >
            <Send className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save Note'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
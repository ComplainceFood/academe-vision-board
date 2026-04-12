import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  FolderPlus, 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal,
  Trash2,
  Edit,
  Home
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Note, FOLDER_COLORS } from '@/types/notes';
import { cn } from '@/lib/utils';

interface FolderSidebarProps {
  folders: Note[];
  notes: Note[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string, color: string) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
}

export function FolderSidebar({
  folders,
  notes,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
}: FolderSidebarProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await onCreateFolder(newFolderName.trim(), selectedColor);
    setNewFolderName('');
    setSelectedColor('blue');
    setIsCreateOpen(false);
  };

  const getNotesInFolder = (folderId: string | null) => {
    return notes.filter(n => n.parent_folder_id === folderId && !n.is_folder);
  };

  const toggleExpanded = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getFolderColorClass = (color: string | null | undefined) => {
    const colorMap: Record<string, string> = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      purple: 'text-purple-500',
      amber: 'text-amber-500',
      rose: 'text-rose-500',
      cyan: 'text-cyan-500',
    };
    return colorMap[color || 'blue'] || 'text-blue-500';
  };

  const rootNotesCount = getNotesInFolder(null).length;

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Notebooks</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsCreateOpen(true)}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div className="space-y-1">
          {/* All Notes */}
          <button
            onClick={() => onSelectFolder(null)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
              selectedFolderId === null
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
          >
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span>All Notes</span>
            </div>
            <Badge variant={selectedFolderId === null ? "secondary" : "outline"} className="text-xs">
              {notes.length}
            </Badge>
          </button>

          {/* Folders */}
          {folders.map((folder) => {
            const folderNotes = getNotesInFolder(folder.id);
            const isExpanded = expandedFolders.has(folder.id);
            const isSelected = selectedFolderId === folder.id;

            return (
              <div key={folder.id}>
                <div
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group",
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <button
                    className="flex items-center gap-2 flex-1 text-left"
                    onClick={() => onSelectFolder(folder.id)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(folder.id);
                      }}
                      className="p-0.5 hover:bg-muted-foreground/20 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </button>
                    <Folder className={cn("h-4 w-4", isSelected ? "" : getFolderColorClass(folder.folder_color))} />
                    <span className="truncate">{folder.title}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <Badge variant={isSelected ? "secondary" : "outline"} className="text-xs">
                      {folderNotes.length}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDeleteFolder(folder.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Folder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Create Folder Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create New Notebook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="My Notebook"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      color.class,
                      selectedColor === color.id 
                        ? 'ring-2 ring-offset-2 ring-primary' 
                        : 'opacity-70 hover:opacity-100'
                    )}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

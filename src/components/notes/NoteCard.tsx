
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Star, MoreVertical, Calendar as CalendarIcon, User as UserIcon, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import type { Database } from "@/integrations/supabase/types";

type Note = Database['public']['Tables']['notes']['Row'];

interface NoteCardProps {
  note: Note;
  onUpdate: () => void;
  onDelete?: (id: string) => Promise<any>;
  onToggleStar?: (id: string) => Promise<any>;
  onToggleStatus?: (id: string) => Promise<any>;
  onDuplicate?: () => Promise<void>;
  className?: string;
  compact?: boolean;
}

export const NoteCard = ({ note, onUpdate, onDelete, onToggleStar, onToggleStatus, onDuplicate, className = "", compact = false }: NoteCardProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleStarToggle = async () => {
    try {
      if (onToggleStar) {
        await onToggleStar(note.id);
      } else {
        const { error } = await supabase
          .from("notes")
          .update({ starred: !note.starred })
          .eq("id", note.id);

        if (error) throw error;

        toast({
          title: note.starred ? t('notes.noteUnstarred') : t('notes.noteStarred'),
          description: `"${note.title}" has been ${note.starred ? t('common.unstar').toLowerCase() : t('common.star').toLowerCase()}.`,
        });

        onUpdate();
      }
    } catch (error) {
      console.error("Error toggling star:", error);
      toast({
        title: t('common.error'),
        description: t('notes.failedUpdateNote'),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (onDelete) {
        await onDelete(note.id);
      } else {
        const { error } = await supabase
          .from("notes")
          .delete()
          .eq("id", note.id);

        if (error) throw error;

        toast({
          title: t('notes.noteDeleted'),
          description: `"${note.title}" ${t('notes.noteDeletedDesc')}`,
        });

        onUpdate();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: t('common.error'),
        description: t('notes.failedDeleteNote'),
        variant: "destructive",
      });
    }
  };

  const handleComplete = async () => {
    if (note.type !== "commitment") return;
    
    try {
      if (onToggleStatus) {
        await onToggleStatus(note.id);
      } else {
        // For commitments, we'll add a "completed" tag
        const updatedTags = [...(note.tags || [])];
        if (!updatedTags.includes("completed")) {
          updatedTags.push("completed");
        } else {
          // If already completed, remove the tag
          const index = updatedTags.indexOf("completed");
          if (index > -1) {
            updatedTags.splice(index, 1);
          }
        }

        const { error } = await supabase
          .from("notes")
          .update({ tags: updatedTags })
          .eq("id", note.id);

        if (error) throw error;

        const isCompleted = updatedTags.includes("completed");
        
        toast({
          title: isCompleted ? t('notes.commitmentComplete') : t('notes.commitmentIncomplete'),
          description: `"${note.title}" ${t('notes.noteUpdatedDesc')}`,
        });

        onUpdate();
      }
    } catch (error) {
      console.error("Error updating note:", error);
      toast({
        title: t('common.error'),
        description: t('notes.failedUpdateNote'),
        variant: "destructive",
      });
    }
  };

  const isCompleted = note.tags?.includes("completed");

  return (
    <Card className={`w-full glassmorphism ${className}`}>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Main content section */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${note.type === 'commitment' ? 'bg-primary/15 text-primary' : note.type === 'reminder' ? 'bg-amber-100 text-amber-700' : 'bg-secondary/15 text-secondary'}`}>
                    {note.type}
                  </span>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full font-medium">{note.course}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    note.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    note.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    note.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {note.priority}
                  </span>
                  {note.starred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                  {isCompleted && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                      {t('notes.completed')}
                    </span>
                  )}
                </div>
                <CardTitle className="text-lg mb-2">{note.title}</CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {note.type === "commitment" && (
                    <DropdownMenuItem onClick={handleComplete}>
                      {isCompleted ? t('common.markIncomplete') : t('common.markComplete')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleStarToggle}>
                    {note.starred ? t('common.unstar') : t('common.star')}
                  </DropdownMenuItem>
                  {onDuplicate && (
                    <DropdownMenuItem onClick={onDuplicate}>
                      <Copy className="h-4 w-4 mr-2" />
                      {t('common.duplicate')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">{t('common.delete')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm leading-relaxed line-clamp-3">{note.content}</p>
              
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.filter(tag => tag !== "completed").map((tag) => (
                    <span key={tag} className="text-xs bg-accent/15 text-accent px-2 py-1 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Compact metadata sidebar */}
          <div className="md:w-48 space-y-2">
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-muted-foreground">{new Date(note.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              {note.due_date && (
                <div className="flex items-center gap-2 text-xs">
                  <CalendarIcon className="h-3 w-3 text-red-500" />
                  <div>
                    <p className="font-medium">Due</p>
                    <p className="text-muted-foreground">{new Date(note.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              
              {note.student_name && (
                <div className="flex items-center gap-2 text-xs">
                  <UserIcon className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Student</p>
                    <p className="text-muted-foreground">{note.student_name}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs">
                <div className={`h-2 w-2 rounded-full ${
                  note.status === 'active' ? 'bg-green-500' :
                  note.status === 'completed' ? 'bg-blue-500' :
                  'bg-gray-500'
                }`} />
                <span className="text-muted-foreground capitalize">{note.status}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

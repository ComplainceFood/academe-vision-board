
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Star, MoreVertical, Calendar as CalendarIcon, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Note = Database['public']['Tables']['notes']['Row'];

interface NoteCardProps {
  note: Note;
  onUpdate: () => void;
  className?: string;
  compact?: boolean;
}

export const NoteCard = ({ note, onUpdate, className = "", compact = false }: NoteCardProps) => {
  const { toast } = useToast();

  const handleStarToggle = async () => {
    try {
      const { error } = await supabase
        .from("notes")
        .update({ starred: !note.starred })
        .eq("id", note.id);

      if (error) throw error;

      toast({
        title: note.starred ? "Note unstarred" : "Note starred",
        description: `"${note.title}" has been ${note.starred ? "unstarred" : "starred"}.`,
      });

      onUpdate();
    } catch (error) {
      console.error("Error toggling star:", error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", note.id);

      if (error) throw error;

      toast({
        title: "Note deleted",
        description: `"${note.title}" has been deleted.`,
      });

      onUpdate();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async () => {
    if (note.type !== "promise") return;
    
    try {
      // For promises, we'll add a "completed" tag
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
        title: isCompleted ? "Promise marked as complete" : "Promise marked as incomplete",
        description: `"${note.title}" has been updated.`,
      });

      onUpdate();
    } catch (error) {
      console.error("Error updating note:", error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const isCompleted = note.tags?.includes("completed");

  return (
    <Card className={`mb-4 glassmorphism ${className} ${compact ? 'p-2' : ''}`}>
      <CardHeader className={`pb-2 flex flex-row justify-between items-start ${compact ? 'p-2' : ''}`}>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs rounded ${note.type === 'promise' ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary'}`}>
              {note.type}
            </span>
            <span className="text-xs bg-muted px-2 py-1 rounded">{note.course}</span>
            {note.starred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
            {isCompleted && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Completed
              </span>
            )}
          </div>
          <CardTitle className={`${compact ? 'text-base' : 'text-lg'} mt-2`}>{note.title}</CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {note.type === "promise" && (
              <DropdownMenuItem onClick={handleComplete}>
                {isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleStarToggle}>
              {note.starred ? "Unstar" : "Star"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className={compact ? 'p-2' : ''}>
        {!compact && <p className="text-sm mb-3">{note.content}</p>}
        {compact && <p className="text-xs mb-2 line-clamp-2">{note.content}</p>}
        
        <div className="flex flex-wrap gap-2 mb-2">
          {note.tags && note.tags.filter(tag => tag !== "completed").map((tag) => (
            <span key={tag} className={`text-xs bg-accent/15 text-accent px-2 py-1 rounded-full ${compact ? 'text-[10px] px-1.5 py-0.5' : ''}`}>
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>{new Date(note.date || '').toLocaleDateString()}</span>
          </div>
          {note.student && (
            <div className="flex items-center gap-1">
              <UserIcon className="h-3 w-3" />
              <span>{note.student}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

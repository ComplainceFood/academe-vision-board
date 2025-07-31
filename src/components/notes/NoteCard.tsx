
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
    if (note.type !== "commitment") return;
    
    try {
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
        title: isCompleted ? "Commitment marked as complete" : "Commitment marked as incomplete",
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
    <Card className={`w-full glassmorphism ${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main content section */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 text-sm rounded-full font-medium ${note.type === 'commitment' ? 'bg-primary/15 text-primary' : note.type === 'reminder' ? 'bg-amber-100 text-amber-700' : 'bg-secondary/15 text-secondary'}`}>
                    {note.type}
                  </span>
                  <span className="text-sm bg-muted px-3 py-1 rounded-full font-medium">{note.course}</span>
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                    note.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    note.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    note.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {note.priority}
                  </span>
                  {note.starred && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
                  {isCompleted && (
                    <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                      Completed
                    </span>
                  )}
                </div>
                <CardTitle className="text-xl mb-3">{note.title}</CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {note.type === "commitment" && (
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
            </div>
            
            <div className="space-y-4">
              <p className="text-base leading-relaxed">{note.content}</p>
              
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {note.tags.filter(tag => tag !== "completed").map((tag) => (
                    <span key={tag} className="text-sm bg-accent/15 text-accent px-3 py-1 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Metadata sidebar */}
          <div className="md:w-64 space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-muted-foreground">{new Date(note.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              {note.due_date && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="font-medium">Due Date</p>
                    <p className="text-muted-foreground">{new Date(note.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              
              {note.student_name && (
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Student</p>
                    <p className="text-muted-foreground">{note.student_name}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <div className={`h-3 w-3 rounded-full ${
                  note.status === 'active' ? 'bg-green-500' :
                  note.status === 'completed' ? 'bg-blue-500' :
                  'bg-gray-500'
                }`} />
                <div>
                  <p className="font-medium">Status</p>
                  <p className="text-muted-foreground capitalize">{note.status}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

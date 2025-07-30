
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateNoteDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNoteCreated?: () => void;
}

export function CreateNoteDialog({ open, onOpenChange, onNoteCreated }: CreateNoteDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [course, setCourse] = useState("");
  const [type, setType] = useState<"note" | "commitment">("note");
  const [student, setStudent] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Use external state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = onOpenChange || setInternalOpen;

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCourse("");
    setType("note");
    setStudent("");
    setTags("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create notes",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Parse tags from comma-separated string
      const parsedTags = tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      console.log("Creating note with data:", {
        title,
        content,
        course,
        type,
        user_id: user.id,
        tags: parsedTags,
        student: type === "commitment" ? (student || null) : null,
      });

      const { data, error } = await supabase.from("notes").insert([
        {
          title,
          content,
          course,
          type,
          user_id: user.id,
          date: new Date().toISOString(),
          starred: false,
          tags: parsedTags,
          student: type === "commitment" ? (student || null) : null,
        },
      ]).select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Note created successfully:", data);

      toast({
        title: "Success",
        description: `${type === "note" ? "Note" : "Commitment"} created successfully`,
      });

      handleOpenChange(false);
      resetForm();
      
      // Call the callback if provided, otherwise trigger the default event
      if (onNoteCreated) {
        onNoteCreated();
      } else {
        window.dispatchEvent(new Event("seedDataCompleted"));
      }
    } catch (error) {
      console.error("Error creating note:", error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    handleOpenChange(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      {/* Only show trigger if no external control is provided */}
      {open === undefined && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Note
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New {type === "note" ? "Note" : "Commitment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as "note" | "commitment")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="commitment">Commitment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <Input
              id="course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              required
            />
          </div>
          {type === "commitment" && (
            <div className="space-y-2">
              <Label htmlFor="student">Student (Optional)</Label>
              <Input
                id="student"
                value={student}
                onChange={(e) => setStudent(e.target.value)}
                placeholder="Student name if applicable"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., important, follow-up, urgent"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : `Create ${type === "note" ? "Note" : "Commitment"}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

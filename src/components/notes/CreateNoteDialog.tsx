
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNotes } from "@/hooks/useNotes";
import { useProfile } from "@/hooks/useProfile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TemplateSelector } from "@/components/common/TemplateSelector";
import { GrantNoteToggle } from "@/components/notes/GrantNoteToggle";

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
  const { createNote } = useNotes();
  const { profile } = useProfile();

  // Use external state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = onOpenChange || setInternalOpen;

  // Apply smart defaults from profile
  const applySmartDefaults = () => {
    if (profile?.department && !course) {
      setCourse(profile.department);
    }
  };

  // Apply template data
  const handleApplyTemplate = (data: Record<string, any>) => {
    if (data.title) setTitle(data.title);
    if (data.content) setContent(data.content);
    if (data.course) setCourse(data.course);
    if (data.type) setType(data.type);
    if (data.tags) setTags(data.tags);
  };

  // Get current form data for template saving
  const getCurrentFormData = () => ({
    title,
    content,
    course,
    type,
    tags,
  });


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

      const noteData = {
        title,
        content,
        course,
        type,
        tags: parsedTags,
        student_name: type === "commitment" ? (student || null) : null,
        starred: false,
      };

      await createNote(noteData);

      handleOpenChange(false);
      resetForm();
      
      // Call the callback if provided
      if (onNoteCreated) {
        onNoteCreated();
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
    if (newOpen) {
      applySmartDefaults();
    }
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
          <div className="flex items-center justify-between">
            <DialogTitle>Create New {type === "note" ? "Note" : "Commitment"}</DialogTitle>
            <TemplateSelector
              type="note"
              currentData={getCurrentFormData()}
              onApplyTemplate={handleApplyTemplate}
            />
          </div>
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

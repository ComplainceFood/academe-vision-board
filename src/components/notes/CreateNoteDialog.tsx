
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

export function CreateNoteDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [course, setCourse] = useState("");
  const [type, setType] = useState<"note" | "promise">("note");
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from("notes").insert([
        {
          title,
          content,
          course,
          type,
          user_id: user.id,
          date: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note created successfully",
      });

      setIsOpen(false);
      setTitle("");
      setContent("");
      setCourse("");
      setType("note");
      
      // Trigger a refresh of the notes list
      window.dispatchEvent(new Event("seedDataCompleted"));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as "note" | "promise")}
              className="w-full p-2 border rounded-md"
            >
              <option value="note">Note</option>
              <option value="promise">Promise</option>
            </select>
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
          <Button type="submit" className="w-full">
            Create Note
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

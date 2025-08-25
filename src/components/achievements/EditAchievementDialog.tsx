import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Achievement {
  id: string;
  title: string;
  description?: string;
  venue?: string;
  date?: string;
  co_authors?: string[];
  url?: string;
  impact_factor?: number;
  status: string;
  visibility?: string;
  tags?: string[];
  category?: string;
}

interface EditAchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  achievement: Achievement;
  onSuccess: () => void;
}

export function EditAchievementDialog({ open, onOpenChange, achievement, onSuccess }: EditAchievementDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    venue: "",
    date: "",
    url: "",
    impact_factor: "",
    status: "completed",
    visibility: "public",
    co_authors: [] as string[],
    tags: [] as string[]
  });
  const [newCoAuthor, setNewCoAuthor] = useState("");
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (achievement) {
      setFormData({
        title: achievement.title || "",
        description: achievement.description || "",
        venue: achievement.venue || "",
        date: achievement.date || "",
        url: achievement.url || "",
        impact_factor: achievement.impact_factor?.toString() || "",
        status: achievement.status || "completed",
        visibility: achievement.visibility || "public",
        co_authors: achievement.co_authors || [],
        tags: achievement.tags || []
      });
    }
  }, [achievement]);

  const getCategoryLabel = () => {
    switch (achievement.category) {
      case "publication": return "Publication";
      case "research_presentation": return "Research Presentation";
      case "invited_talk": return "Invited Talk";
      case "leadership_role": return "Leadership Role";
      default: return "Achievement";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from("scholastic_achievements")
        .update({
          title: formData.title,
          description: formData.description || null,
          venue: formData.venue || null,
          date: formData.date || null,
          url: formData.url || null,
          impact_factor: formData.impact_factor ? parseFloat(formData.impact_factor) : null,
          status: formData.status,
          visibility: formData.visibility,
          co_authors: formData.co_authors.length > 0 ? formData.co_authors : null,
          tags: formData.tags.length > 0 ? formData.tags : null
        })
        .eq("id", achievement.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${getCategoryLabel()} updated successfully`,
      });
      onSuccess();
    } catch (error) {
      console.error("Error updating achievement:", error);
      toast({
        title: "Error",
        description: `Failed to update ${getCategoryLabel().toLowerCase()}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCoAuthor = () => {
    if (newCoAuthor.trim() && !formData.co_authors.includes(newCoAuthor.trim())) {
      setFormData(prev => ({
        ...prev,
        co_authors: [...prev.co_authors, newCoAuthor.trim()]
      }));
      setNewCoAuthor("");
    }
  };

  const removeCoAuthor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      co_authors: prev.co_authors.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {getCategoryLabel()}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">
              {achievement.category === "publication" ? "Journal/Publisher" : 
               achievement.category === "leadership_role" ? "Organization" : "Venue"}
            </Label>
            <Input
              id="venue"
              value={formData.venue}
              onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
              placeholder={achievement.category === "publication" ? "Journal or publisher name" : 
                         achievement.category === "leadership_role" ? "Organization name" : "Event venue"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  {achievement.category === "publication" && (
                    <>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {achievement.category === "publication" && (
            <div className="space-y-2">
              <Label htmlFor="impact_factor">Impact Factor</Label>
              <Input
                id="impact_factor"
                type="number"
                step="0.001"
                value={formData.impact_factor}
                onChange={(e) => setFormData(prev => ({ ...prev, impact_factor: e.target.value }))}
                placeholder="0.000"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          {(achievement.category === "publication" || achievement.category === "research_presentation") && (
            <div className="space-y-2">
              <Label>
                {achievement.category === "publication" ? "Co-authors" : "Co-presenters"}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newCoAuthor}
                  onChange={(e) => setNewCoAuthor(e.target.value)}
                  placeholder="Enter name and press Add"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCoAuthor())}
                />
                <Button type="button" onClick={addCoAuthor} variant="outline">
                  Add
                </Button>
              </div>
              {formData.co_authors.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.co_authors.map((author, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {author}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeCoAuthor(index)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter tag and press Add"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(index)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={formData.visibility} onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : `Update ${getCategoryLabel()}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
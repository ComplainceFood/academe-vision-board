import { useState } from "react";
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
import { useAuth } from "@/hooks/useAuth";

interface CreateAchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: "publication" | "research_presentation" | "invited_talk" | "leadership_role" | "course_taught" | "award_honor" | "service_review" | "student_supervision" | "teaching_performance" | "professional_development" | "external_impact";
  onSuccess: () => void;
}

export function CreateAchievementDialog({ open, onOpenChange, category, onSuccess }: CreateAchievementDialogProps) {
  const { user } = useAuth();
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
    tags: [] as string[],
    term: "",
    student_count: "",
    award_type: "",
    organization: "",
    journal_name: "",
    review_count: "",
    student_name: "",
    student_level: "" as "" | "undergraduate" | "masters" | "phd" | "postdoc",
    evaluation_score: "",
    course_code: ""
  });
  const [newCoAuthor, setNewCoAuthor] = useState("");
  const [newTag, setNewTag] = useState("");

  const getCategoryLabel = () => {
    switch (category) {
      case "publication": return "Publication";
      case "research_presentation": return "Research Presentation";
      case "invited_talk": return "Invited Talk";
      case "leadership_role": return "Leadership Role";
      case "course_taught": return "Course Taught";
      case "award_honor": return "Award/Honor";
      case "service_review": return "Service/Review";
      case "student_supervision": return "Student Supervision";
      case "teaching_performance": return "Teaching Performance";
      case "professional_development": return "Professional Development";
      case "external_impact": return "External Impact";
      default: return "Achievement";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("scholastic_achievements")
        .insert({
          user_id: user.id,
          category,
          title: formData.title,
          description: formData.description || null,
          venue: formData.venue || null,
          date: formData.date || null,
          url: formData.url || null,
          impact_factor: formData.impact_factor ? parseFloat(formData.impact_factor) : null,
          status: formData.status,
          visibility: formData.visibility,
          co_authors: formData.co_authors.length > 0 ? formData.co_authors : null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          term: formData.term || null,
          student_count: formData.student_count ? parseInt(formData.student_count) : null,
          award_type: formData.award_type || null,
          organization: formData.organization || null,
          journal_name: formData.journal_name || null,
          review_count: formData.review_count ? parseInt(formData.review_count) : null,
          student_name: formData.student_name || null,
          student_level: formData.student_level || null,
          evaluation_score: formData.evaluation_score ? parseFloat(formData.evaluation_score) : null,
          course_code: formData.course_code || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${getCategoryLabel()} created successfully`,
      });
      onSuccess();
    } catch (error) {
      console.error("Error creating achievement:", error);
      toast({
        title: "Error",
        description: `Failed to create ${getCategoryLabel().toLowerCase()}`,
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
          <DialogTitle>Add {getCategoryLabel()}</DialogTitle>
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
              {category === "publication" ? "Journal/Publisher" : 
               category === "leadership_role" ? "Organization" : "Venue"}
            </Label>
            <Input
              id="venue"
              value={formData.venue}
              onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
              placeholder={category === "publication" ? "Journal or publisher name" : 
                         category === "leadership_role" ? "Organization name" : "Event venue"}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {category === "publication" && (
                    <>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {category === "publication" && (
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

          {category === "course_taught" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="term">Term</Label>
                <Input
                  id="term"
                  value={formData.term}
                  onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value }))}
                  placeholder="e.g. Fall 2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student_count">Number of Students</Label>
                <Input
                  id="student_count"
                  type="number"
                  value={formData.student_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, student_count: e.target.value }))}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          )}

          {category === "award_honor" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="award_type">Award Type</Label>
                <Input
                  id="award_type"
                  value={formData.award_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, award_type: e.target.value }))}
                  placeholder="e.g. Teaching Award, Fellowship"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  placeholder="Awarding organization"
                />
              </div>
            </div>
          )}

          {category === "service_review" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="journal_name">Journal/Organization</Label>
                <Input
                  id="journal_name"
                  value={formData.journal_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, journal_name: e.target.value }))}
                  placeholder="Journal or organization name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review_count">Number of Reviews</Label>
                <Input
                  id="review_count"
                  type="number"
                  value={formData.review_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, review_count: e.target.value }))}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          )}

          {category === "student_supervision" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student_name">Student Name</Label>
                <Input
                  id="student_name"
                  value={formData.student_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, student_name: e.target.value }))}
                  placeholder="Student's name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student_level">Student Level</Label>
                <Select value={formData.student_level} onValueChange={(value) => setFormData(prev => ({ ...prev, student_level: value as any }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="masters">Masters</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="postdoc">Postdoc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {category === "teaching_performance" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course_code">Course Code</Label>
                <Input
                  id="course_code"
                  value={formData.course_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, course_code: e.target.value }))}
                  placeholder="e.g. CS101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evaluation_score">Evaluation Score</Label>
                <Input
                  id="evaluation_score"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.evaluation_score}
                  onChange={(e) => setFormData(prev => ({ ...prev, evaluation_score: e.target.value }))}
                  placeholder="4.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student_count">Number of Students</Label>
                <Input
                  id="student_count"
                  type="number"
                  value={formData.student_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, student_count: e.target.value }))}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          )}

          {category === "professional_development" && (
            <div className="space-y-2">
              <Label htmlFor="organization">Organizer/Institution</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="Conference organizer or institution"
              />
            </div>
          )}

          {category === "external_impact" && (
            <div className="space-y-2">
              <Label htmlFor="organization">Media/Organization</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="Media outlet or organization"
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

          {(category === "publication" || category === "research_presentation") && (
            <div className="space-y-2">
              <Label>
                {category === "publication" ? "Co-authors" : "Co-presenters"}
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
              {loading ? "Creating..." : `Create ${getCategoryLabel()}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
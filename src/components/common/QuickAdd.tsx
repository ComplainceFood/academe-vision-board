import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Zap, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuickAddProps {
  type: "note" | "meeting" | "achievement";
  onQuickAdd: (data: QuickAddData) => Promise<void>;
  onOpenFullForm?: () => void;
  placeholder?: string;
  className?: string;
}

export interface QuickAddData {
  title: string;
  type?: string;
  category?: string;
  course?: string;
  location?: string;
}

const typeOptions = {
  note: [
    { value: "note", label: "Note" },
    { value: "commitment", label: "Commitment" },
    { value: "reminder", label: "Reminder" },
  ],
  meeting: [
    { value: "1:1", label: "1:1 Meeting" },
    { value: "group", label: "Group Meeting" },
  ],
  achievement: [
    { value: "publication", label: "Publication" },
    { value: "research_presentation", label: "Research Presentation" },
    { value: "invited_talk", label: "Invited Talk" },
    { value: "course_taught", label: "Course Taught" },
    { value: "award_honor", label: "Award/Honor" },
  ],
};

export function QuickAdd({ 
  type, 
  onQuickAdd, 
  onOpenFullForm, 
  placeholder,
  className = "" 
}: QuickAddProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState(typeOptions[type]?.[0]?.value || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { profile } = useProfile();

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      // Use smart defaults from profile
      const data: QuickAddData = {
        title: title.trim(),
        type: selectedType,
        category: selectedType,
        course: profile?.department || "General",
        location: profile?.office_location || "",
      };

      await onQuickAdd(data);
      
      setTitle("");
      setIsExpanded(false);
      toast({
        title: "Added successfully",
        description: `"${data.title}" has been created.`,
      });
    } catch (error) {
      console.error("Quick add error:", error);
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setTitle("");
      setIsExpanded(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsExpanded(true)}
        className={`gap-2 border-dashed ${className}`}
      >
        <Zap className="h-4 w-4 text-primary" />
        Quick Add
      </Button>
    );
  }

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`flex items-center gap-2 p-2 rounded-lg border bg-card animate-fade-in ${className}`}
    >
      <Zap className="h-4 w-4 text-primary shrink-0" />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 shrink-0">
            {typeOptions[type]?.find(t => t.value === selectedType)?.label || "Type"}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {typeOptions[type]?.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setSelectedType(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || `Enter ${type} title...`}
        className="flex-1 h-8 border-0 focus-visible:ring-0 bg-transparent"
        disabled={isSubmitting}
      />
      
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="submit"
          size="sm"
          className="h-8"
          disabled={!title.trim() || isSubmitting}
        >
          <Plus className="h-4 w-4" />
        </Button>
        
        {onOpenFullForm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              handleCancel();
              onOpenFullForm();
            }}
          >
            Full Form
          </Button>
        )}
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Plus, X, Repeat, Sparkles, Loader2, Wand2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNotes } from "@/hooks/useNotes";
import { Subtask, RECURRENCE_LABELS, RecurrencePattern } from "@/types/notes";
import { Switch } from "@/components/ui/switch";
import { GrantNoteToggle } from "@/components/notes/GrantNoteToggle";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  label: string;
}

interface CreateTaskDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  categories: Category[];
}

export function CreateTaskDialog({ open, onOpenChange, categories }: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [studentName, setStudentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI draft state
  const [roughDescription, setRoughDescription] = useState("");
  const [isAIDrafting, setIsAIDrafting] = useState(false);
  const [aiReasoning, setAIReasoning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  // New fields
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>("weekly");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>();
  const [isGrantNote, setIsGrantNote] = useState(false);
  const [fundingSourceId, setFundingSourceId] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const { createNote } = useNotes();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setPriority("medium");
    setDueDate(undefined);
    setStudentName("");
    setSubtasks([]);
    setNewSubtask("");
    setIsRecurring(false);
    setRecurrencePattern("weekly");
    setRecurrenceEndDate(undefined);
    setIsGrantNote(false);
    setFundingSourceId(null);
    setRoughDescription("");
    setAIReasoning(null);
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, {
      id: crypto.randomUUID(),
      title: newSubtask.trim(),
      completed: false,
    }]);
    setNewSubtask("");
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleAIDraft = async () => {
    if (!roughDescription.trim()) {
      toast({ title: "Enter a description", description: "Type a brief description of your task first.", variant: "destructive" });
      return;
    }
    setIsAIDrafting(true);
    setAIReasoning(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-draft-note", {
        body: {
          rough_description: roughDescription,
          today: new Date().toISOString().split('T')[0],
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setTitle(data.title || "");
      setDescription(data.description || "");
      if (data.priority) setPriority(data.priority);
      if (data.category && categories.some(c => c.id === data.category)) {
        setCategory(data.category);
      }
      if (data.suggested_due_date) {
        const parsed = new Date(data.suggested_due_date);
        if (!isNaN(parsed.getTime())) setDueDate(parsed);
      }
      if (data.subtasks?.length) {
        setSubtasks(data.subtasks.map((t: string) => ({
          id: crypto.randomUUID(),
          title: t,
          completed: false,
        })));
        setActiveTab("subtasks");
      } else {
        setActiveTab("basic");
      }
      if (data.reasoning) setAIReasoning(data.reasoning);

      toast({ title: "AI draft ready", description: "Review and adjust the generated task before saving." });
    } catch (err) {
      console.error("AI draft error:", err);
      toast({ title: "AI draft failed", description: "Couldn't generate draft. Fill in the form manually.", variant: "destructive" });
    } finally {
      setIsAIDrafting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to create tasks", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      await createNote({
        title,
        content: description,
        type: 'commitment',
        course: category || 'General',
        priority,
        tags: category ? [category] : [],
        due_date: dueDate?.toISOString(),
        student_name: studentName || undefined,
        starred: false,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        recurrence_pattern: isRecurring ? recurrencePattern : null,
        recurrence_end_date: isRecurring && recurrenceEndDate ? recurrenceEndDate.toISOString().split('T')[0] : null,
        funding_source_id: isGrantNote ? fundingSourceId : null,
      });

      onOpenChange?.(false);
      resetForm();
    } catch (error) {
      console.error("Error creating task:", error);
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* AI Draft Panel */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">AI Task Assistant</span>
              <Badge variant="secondary" className="text-xs">Beta</Badge>
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Describe your task in plain language… e.g. 'Finish grading midterm papers for CS 301 by end of week'"
                value={roughDescription}
                onChange={(e) => setRoughDescription(e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAIDraft}
                disabled={isAIDrafting || !roughDescription.trim()}
                className="self-end shrink-0"
              >
                {isAIDrafting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {isAIDrafting ? "" : "Draft"}
              </Button>
            </div>
            {aiReasoning && (
              <p className="text-xs text-muted-foreground italic">{aiReasoning}</p>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="subtasks">
                Subtasks {subtasks.length > 0 && <Badge variant="secondary" className="ml-1 h-4 text-xs">{subtasks.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="recurring">Recurring</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more details..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student">Student Name</Label>
                  <Input
                    id="student"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <GrantNoteToggle
                isGrantNote={isGrantNote}
                onGrantNoteChange={setIsGrantNote}
                fundingSourceId={fundingSourceId}
                onFundingSourceChange={setFundingSourceId}
              />
            </TabsContent>

            <TabsContent value="subtasks" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Break down your task into steps</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a subtask..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSubtask();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addSubtask} disabled={!newSubtask.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {subtasks.length > 0 && (
                <div className="space-y-2 border rounded-lg p-3">
                  {subtasks.map((subtask, index) => (
                    <div key={subtask.id} className="flex items-center justify-between gap-2 py-1">
                      <span className="text-sm flex items-center gap-2">
                        <span className="text-muted-foreground">{index + 1}.</span>
                        {subtask.title}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeSubtask(subtask.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {subtasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No subtasks yet. Add steps to track progress.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recurring" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Repeat className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Make this a recurring task</p>
                    <p className="text-sm text-muted-foreground">
                      Task will auto-regenerate when completed
                    </p>
                  </div>
                </div>
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
              </div>

              {isRecurring && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <Label>Repeat Pattern</Label>
                    <Select value={recurrencePattern} onValueChange={(v) => setRecurrencePattern(v as RecurrencePattern)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(RECURRENCE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !recurrenceEndDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {recurrenceEndDate ? format(recurrenceEndDate, "PPP") : "No end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={recurrenceEndDate}
                          onSelect={setRecurrenceEndDate}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    {recurrenceEndDate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setRecurrenceEndDate(undefined)}
                        className="text-xs"
                      >
                        Clear end date
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

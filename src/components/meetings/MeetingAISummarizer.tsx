import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MeetingAISummarizerProps {
  meetingId: string;
  title: string;
  agenda?: string;
  notes?: string;
  onActionItemsAdded: () => void;
}

interface SummaryResult {
  summary: string;
  action_items: string[];
}

export function MeetingAISummarizer({
  meetingId,
  title,
  agenda,
  notes,
  onActionItemsAdded,
}: MeetingAISummarizerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [addingItems, setAddingItems] = useState<Set<number>>(new Set());
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());

  const handleSummarize = async () => {
    if (!notes && !agenda) {
      toast({
        title: "Nothing to summarize",
        description: "Add meeting notes or an agenda first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setAddedItems(new Set());

    try {
      const { data, error } = await supabase.functions.invoke("summarize-meeting", {
        body: { title, agenda, notes },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data as SummaryResult);
      setExpanded(true);
    } catch (err) {
      console.error("AI summarize error:", err);
      toast({
        title: "Summarization failed",
        description: "Could not generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddActionItem = async (item: string, index: number) => {
    setAddingItems((prev) => new Set(prev).add(index));
    try {
      const { data: existing } = await supabase
        .from("meetings")
        .select("action_items")
        .eq("id", meetingId)
        .single();

      const currentItems: any[] = existing?.action_items ?? [];
      const newItem = {
        id: Date.now().toString(),
        description: item,
        assignee: "",
        due_date: "",
        completed: false,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("meetings")
        .update({ action_items: [...currentItems, newItem] as any })
        .eq("id", meetingId);

      if (error) throw error;

      setAddedItems((prev) => new Set(prev).add(index));
      onActionItemsAdded();
      toast({ title: "Action item added" });
    } catch (err) {
      console.error("Add action item error:", err);
      toast({
        title: "Failed to add action item",
        variant: "destructive",
      });
    } finally {
      setAddingItems((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const handleAddAll = async () => {
    if (!result) return;
    const unadded = result.action_items.filter((_, i) => !addedItems.has(i));
    for (let i = 0; i < result.action_items.length; i++) {
      if (!addedItems.has(i)) {
        await handleAddActionItem(result.action_items[i], i);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">AI Meeting Assistant</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSummarize}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "Summarizing..." : "Summarize with AI"}
        </Button>
      </div>

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Summary
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CardTitle>
          </CardHeader>

          {expanded && (
            <CardContent className="px-4 pb-4 space-y-4">
              <p className="text-sm leading-relaxed">{result.summary}</p>

              {result.action_items.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Suggested Action Items
                    </span>
                    {result.action_items.some((_, i) => !addedItems.has(i)) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={handleAddAll}
                      >
                        Add all
                      </Button>
                    )}
                  </div>

                  <ul className="space-y-1.5">
                    {result.action_items.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm bg-background rounded-md px-3 py-2 border"
                      >
                        <span className="flex-1">{item}</span>
                        {addedItems.has(i) ? (
                          <Badge variant="secondary" className="text-xs shrink-0">Added</Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 text-primary"
                            disabled={addingItems.has(i)}
                            onClick={() => handleAddActionItem(item, i)}
                          >
                            {addingItems.has(i) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

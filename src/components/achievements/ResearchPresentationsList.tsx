import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Presentation, ExternalLink, Edit, Trash2 } from "lucide-react";
import { useDataFetching } from "@/hooks/useDataFetching";
import { CreateAchievementDialog } from "./CreateAchievementDialog";
import { EditAchievementDialog } from "./EditAchievementDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResearchPresentation {
  id: string;
  title: string;
  description?: string;
  venue?: string;
  date?: string;
  co_authors?: string[];
  url?: string;
  status: string;
  tags?: string[];
}

export function ResearchPresentationsList({ searchQuery = '' }: { searchQuery?: string } = {}) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ResearchPresentation | null>(null);
  const { toast } = useToast();

  const { data: presentations, isLoading, refetch } = useDataFetching<ResearchPresentation>({
    table: "scholastic_achievements",
    filters: [{ column: "category", value: "research_presentation", operator: "eq" }],
    transform: (data) => data || []
  });

  const filteredPresentations = presentations.filter(item =>
    !searchQuery ||
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("scholastic_achievements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Presentation deleted successfully",
      });
      refetch();
    } catch (error) {
      console.error("Error deleting presentation:", error);
      toast({
        title: "Error",
        description: "Failed to delete presentation",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "submitted": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div className="space-y-4">
      {[1, 2].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </CardContent>
        </Card>
      ))}
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Presentation className="h-5 w-5" />
          <span className="font-medium">{filteredPresentations.length} Research Presentations</span>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Presentation
        </Button>
      </div>

      {!filteredPresentations.length ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Presentation className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No research presentations yet</h3>
            <p className="text-muted-foreground mb-4">
              Track your conference presentations and research talks
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Presentation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPresentations.map((presentation) => (
            <Card key={presentation.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{presentation.title}</CardTitle>
                    {presentation.venue && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {presentation.venue}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(presentation.status)}>
                      {presentation.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingItem(presentation)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(presentation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {presentation.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {presentation.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {presentation.date && (
                    <span>Date: {new Date(presentation.date).toLocaleDateString()}</span>
                  )}
                  {presentation.co_authors && presentation.co_authors.length > 0 && (
                    <span>Co-presenters: {presentation.co_authors.join(", ")}</span>
                  )}
                </div>

                {presentation.tags && presentation.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {presentation.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {presentation.url && (
                  <div className="mt-3">
                    <Button variant="outline" size="sm" asChild>
                      <a href={presentation.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Presentation
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateAchievementDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        category="research_presentation"
        onSuccess={() => {
          refetch();
          setShowCreateDialog(false);
        }}
      />

      {editingItem && (
        <EditAchievementDialog
          open={!!editingItem}
          onOpenChange={() => setEditingItem(null)}
          achievement={editingItem}
          onSuccess={() => {
            refetch();
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
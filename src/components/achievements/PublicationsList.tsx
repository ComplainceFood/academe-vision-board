import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, ExternalLink, Edit, Trash2 } from "lucide-react";
import { useDataFetching } from "@/hooks/useDataFetching";
import { CreateAchievementDialog } from "./CreateAchievementDialog";
import { EditAchievementDialog } from "./EditAchievementDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Publication {
  id: string;
  title: string;
  description?: string;
  venue?: string;
  date?: string;
  co_authors?: string[];
  url?: string;
  impact_factor?: number;
  status: string;
  tags?: string[];
}

export function PublicationsList() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Publication | null>(null);
  const { toast } = useToast();

  const { data: publications, isLoading, refetch } = useDataFetching<Publication>({
    table: "scholastic_achievements",
    filters: [{ column: "category", value: "publication", operator: "eq" }],
    transform: (data) => data || []
  });

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("scholastic_achievements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Publication deleted successfully",
      });
      refetch();
    } catch (error) {
      console.error("Error deleting publication:", error);
      toast({
        title: "Error",
        description: "Failed to delete publication",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800";
      case "accepted": return "bg-blue-100 text-blue-800";
      case "submitted": return "bg-yellow-100 text-yellow-800";
      case "in_progress": return "bg-orange-100 text-orange-800";
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
          <BookOpen className="h-5 w-5" />
          <span className="font-medium">{publications?.length || 0} Publications</span>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Publication
        </Button>
      </div>

      {!publications?.length ? (
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No publications yet</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking your publications and book chapters
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Publication
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {publications.map((publication) => (
            <Card key={publication.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{publication.title}</CardTitle>
                    {publication.venue && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {publication.venue}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(publication.status)}>
                      {publication.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingItem(publication)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(publication.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {publication.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {publication.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {publication.date && (
                    <span>Date: {new Date(publication.date).toLocaleDateString()}</span>
                  )}
                  {publication.impact_factor && (
                    <span>Impact Factor: {publication.impact_factor}</span>
                  )}
                  {publication.co_authors && publication.co_authors.length > 0 && (
                    <span>Co-authors: {publication.co_authors.join(", ")}</span>
                  )}
                </div>

                {publication.tags && publication.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {publication.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {publication.url && (
                  <div className="mt-3">
                    <Button variant="outline" size="sm" asChild>
                      <a href={publication.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Publication
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
        category="publication"
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
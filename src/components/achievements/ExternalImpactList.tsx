import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, ExternalLink, Globe, Calendar, Radio } from "lucide-react";
import { useDataFetching } from "@/hooks/useDataFetching";
import { CreateAchievementDialog } from "./CreateAchievementDialog";
import { EditAchievementDialog } from "./EditAchievementDialog";
import { Achievement } from "@/types/achievements";

export const ExternalImpactList = ({ searchQuery = '' }: { searchQuery?: string } = {}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);

  const { data: achievements, isLoading } = useDataFetching<Achievement>({
    table: 'scholastic_achievements',
    filters: [{ column: 'category', value: 'external_impact' }]
  });

  const filteredAchievements = achievements.filter(item =>
    !searchQuery ||
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'in_progress': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading external impact...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          Track media coverage, policy influence, industry collaborations, and public engagement.
        </p>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Impact
        </Button>
      </div>

      {filteredAchievements.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No external impact yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your broader impact beyond academia.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Impact
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAchievements.map((achievement) => (
            <Card key={achievement.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{achievement.title}</CardTitle>
                    {achievement.venue && (
                      <CardDescription className="flex items-center gap-2">
                        <Radio className="h-4 w-4" />
                        {achievement.venue}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(achievement.status)}>
                      {achievement.status.replace('_', ' ')}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingAchievement(achievement)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {achievement.description && (
                  <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm">
                  {achievement.organization && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>Organization: {achievement.organization}</span>
                    </div>
                  )}
                  {achievement.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(achievement.date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {achievement.tags && achievement.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {achievement.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {achievement.url && (
                  <div className="mt-3">
                    <Button variant="outline" size="sm" asChild>
                      <a href={achievement.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
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
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        category="external_impact"
        onSuccess={() => setIsCreateDialogOpen(false)}
      />

      {editingAchievement && (
        <EditAchievementDialog
          achievement={editingAchievement}
          open={!!editingAchievement}
          onOpenChange={() => setEditingAchievement(null)}
          onSuccess={() => setEditingAchievement(null)}
        />
      )}
    </div>
  );
};
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, ExternalLink, Award, Calendar } from "lucide-react";
import { useDataFetching } from "@/hooks/useDataFetching";
import { CreateAchievementDialog } from "./CreateAchievementDialog";
import { EditAchievementDialog } from "./EditAchievementDialog";
import { Achievement } from "@/types/achievements";

export const AwardsHonorsList = ({ searchQuery = '' }: { searchQuery?: string } = {}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);

  const { data: achievements, isLoading } = useDataFetching<Achievement>({
    table: 'scholastic_achievements',
    filters: [{ column: 'category', value: 'award_honor' }]
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
    return <div className="text-center py-8">Loading awards and honors...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          Track awards, honors, fellowships, and recognitions received.
        </p>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Award
        </Button>
      </div>

      {filteredAchievements.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No awards or honors yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your awards, honors, and recognitions.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Award
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
                    {achievement.organization && (
                      <CardDescription className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        {achievement.organization}
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
                  {achievement.award_type && (
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span>Type: {achievement.award_type}</span>
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
        category="award_honor"
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
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, ExternalLink, BarChart3, Calendar, Users, Star } from "lucide-react";
import { useDataFetching } from "@/hooks/useDataFetching";
import { CreateAchievementDialog } from "./CreateAchievementDialog";
import { EditAchievementDialog } from "./EditAchievementDialog";
import { Achievement } from "@/types/achievements";

export const TeachingPerformanceList = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);

  const { data: achievements, isLoading } = useDataFetching<Achievement>({
    table: 'scholastic_achievements',
    filters: [{ column: 'category', value: 'teaching_performance' }]
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'in_progress': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return '';
    if (score >= 4.5) return 'text-green-600 font-semibold';
    if (score >= 4.0) return 'text-blue-600 font-semibold';
    if (score >= 3.5) return 'text-orange-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading teaching performance...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          Track course evaluations, teaching innovations, and performance metrics.
        </p>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Evaluation
        </Button>
      </div>

      {achievements.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No teaching performance data yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your course evaluations and teaching metrics.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Evaluation
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {achievements.map((achievement) => (
            <Card key={achievement.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{achievement.title}</CardTitle>
                    {achievement.course_code && (
                      <CardDescription className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        {achievement.course_code}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {achievement.evaluation_score && (
                      <Badge variant="outline" className={getScoreColor(achievement.evaluation_score)}>
                        <Star className="h-3 w-3 mr-1" />
                        {achievement.evaluation_score}/5.0
                      </Badge>
                    )}
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
                  {achievement.term && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Term: {achievement.term}</span>
                    </div>
                  )}
                  {achievement.student_count && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{achievement.student_count} students</span>
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
        category="teaching_performance"
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
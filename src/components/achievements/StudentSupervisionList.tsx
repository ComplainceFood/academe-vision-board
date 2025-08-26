import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, ExternalLink, UserCheck, Calendar, GraduationCap } from "lucide-react";
import { useDataFetching } from "@/hooks/useDataFetching";
import { CreateAchievementDialog } from "./CreateAchievementDialog";
import { EditAchievementDialog } from "./EditAchievementDialog";
import { Achievement } from "@/types/achievements";

export const StudentSupervisionList = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);

  const { data: achievements, isLoading } = useDataFetching<Achievement>({
    table: 'scholastic_achievements',
    filters: [{ column: 'category', value: 'student_supervision' }]
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'in_progress': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStudentLevelColor = (level?: string) => {
    switch (level) {
      case 'phd': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'postdoc': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'masters': return 'bg-green-100 text-green-800 border-green-200';
      case 'undergraduate': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading student supervision...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          Track students you've supervised, mentored, or served on committees for.
        </p>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      {achievements.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No student supervision yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking students you've supervised or mentored.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Student
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
                    {achievement.student_name && (
                      <CardDescription className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        {achievement.student_name}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {achievement.student_level && (
                      <Badge className={getStudentLevelColor(achievement.student_level)}>
                        {achievement.student_level.toUpperCase()}
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
                  {achievement.venue && (
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>Institution: {achievement.venue}</span>
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
        category="student_supervision"
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
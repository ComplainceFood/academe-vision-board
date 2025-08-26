import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PublicationsList } from "@/components/achievements/PublicationsList";
import { ResearchPresentationsList } from "@/components/achievements/ResearchPresentationsList";
import { InvitedTalksList } from "@/components/achievements/InvitedTalksList";
import { LeadershipRolesList } from "@/components/achievements/LeadershipRolesList";
import { CoursesTaughtList } from "@/components/achievements/CoursesTaughtList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Presentation, Mic, Users, GraduationCap } from "lucide-react";

const AchievementsPage = () => {
  const [activeTab, setActiveTab] = useState("publications");

  const tabStats = {
    publications: { count: 0, icon: BookOpen },
    presentations: { count: 0, icon: Presentation },
    talks: { count: 0, icon: Mic },
    leadership: { count: 0, icon: Users },
    courses: { count: 0, icon: GraduationCap }
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Scholastic Achievements</h2>
          <Badge variant="secondary" className="text-sm">
            Academic Portfolio
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Track Your Academic Accomplishments</CardTitle>
            <CardDescription>
              Manage and showcase your publications, presentations, invited talks, and leadership roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="publications" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Publications</span>
                </TabsTrigger>
                <TabsTrigger value="presentations" className="flex items-center gap-2">
                  <Presentation className="h-4 w-4" />
                  <span className="hidden sm:inline">Research</span>
                </TabsTrigger>
                <TabsTrigger value="talks" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  <span className="hidden sm:inline">Talks</span>
                </TabsTrigger>
                <TabsTrigger value="leadership" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Leadership</span>
                </TabsTrigger>
                <TabsTrigger value="courses" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">Courses</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="publications" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Publications & Book Chapters</h3>
                </div>
                <PublicationsList />
              </TabsContent>

              <TabsContent value="presentations" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Research Presentations</h3>
                </div>
                <ResearchPresentationsList />
              </TabsContent>

              <TabsContent value="talks" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Invited Talks & Oral Presentations</h3>
                </div>
                <InvitedTalksList />
              </TabsContent>

              <TabsContent value="leadership" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Leadership & Organizational Roles</h3>
                </div>
                <LeadershipRolesList />
              </TabsContent>

              <TabsContent value="courses" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Courses Taught</h3>
                </div>
                <CoursesTaughtList />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AchievementsPage;
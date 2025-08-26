import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PublicationsList } from "@/components/achievements/PublicationsList";
import { ResearchPresentationsList } from "@/components/achievements/ResearchPresentationsList";
import { InvitedTalksList } from "@/components/achievements/InvitedTalksList";
import { LeadershipRolesList } from "@/components/achievements/LeadershipRolesList";
import { CoursesTaughtList } from "@/components/achievements/CoursesTaughtList";
import { AwardsHonorsList } from "@/components/achievements/AwardsHonorsList";
import { ServiceReviewsList } from "@/components/achievements/ServiceReviewsList";
import { StudentSupervisionList } from "@/components/achievements/StudentSupervisionList";
import { TeachingPerformanceList } from "@/components/achievements/TeachingPerformanceList";
import { ProfessionalDevelopmentList } from "@/components/achievements/ProfessionalDevelopmentList";
import { ExternalImpactList } from "@/components/achievements/ExternalImpactList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Presentation, Mic, Users, GraduationCap, Award, Shield, UserCheck, BarChart3, TrendingUp, Globe } from "lucide-react";

const AchievementsPage = () => {
  const [activeTab, setActiveTab] = useState("publications");

  const tabStats = {
    publications: { count: 0, icon: BookOpen },
    presentations: { count: 0, icon: Presentation },
    talks: { count: 0, icon: Mic },
    leadership: { count: 0, icon: Users },
    courses: { count: 0, icon: GraduationCap },
    awards: { count: 0, icon: Award },
    service: { count: 0, icon: Shield },
    supervision: { count: 0, icon: UserCheck },
    teaching: { count: 0, icon: BarChart3 },
    development: { count: 0, icon: TrendingUp },
    impact: { count: 0, icon: Globe }
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
              <TabsList className="grid w-full grid-cols-5 lg:grid-cols-11 gap-1 h-auto p-1">
                <TabsTrigger value="publications" className="flex items-center gap-2 text-xs">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Publications</span>
                </TabsTrigger>
                <TabsTrigger value="presentations" className="flex items-center gap-2 text-xs">
                  <Presentation className="h-4 w-4" />
                  <span className="hidden sm:inline">Research</span>
                </TabsTrigger>
                <TabsTrigger value="talks" className="flex items-center gap-2 text-xs">
                  <Mic className="h-4 w-4" />
                  <span className="hidden sm:inline">Talks</span>
                </TabsTrigger>
                <TabsTrigger value="leadership" className="flex items-center gap-2 text-xs">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Leadership</span>
                </TabsTrigger>
                <TabsTrigger value="courses" className="flex items-center gap-2 text-xs">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">Courses</span>
                </TabsTrigger>
                <TabsTrigger value="awards" className="flex items-center gap-2 text-xs">
                  <Award className="h-4 w-4" />
                  <span className="hidden sm:inline">Awards</span>
                </TabsTrigger>
                <TabsTrigger value="service" className="flex items-center gap-2 text-xs">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Service</span>
                </TabsTrigger>
                <TabsTrigger value="supervision" className="flex items-center gap-2 text-xs">
                  <UserCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Students</span>
                </TabsTrigger>
                <TabsTrigger value="teaching" className="flex items-center gap-2 text-xs">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Teaching</span>
                </TabsTrigger>
                <TabsTrigger value="development" className="flex items-center gap-2 text-xs">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Development</span>
                </TabsTrigger>
                <TabsTrigger value="impact" className="flex items-center gap-2 text-xs">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">Impact</span>
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

              <TabsContent value="awards" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Awards & Honors</h3>
                </div>
                <AwardsHonorsList />
              </TabsContent>

              <TabsContent value="service" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Service & Reviews</h3>
                </div>
                <ServiceReviewsList />
              </TabsContent>

              <TabsContent value="supervision" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Student Supervision & Mentoring</h3>
                </div>
                <StudentSupervisionList />
              </TabsContent>

              <TabsContent value="teaching" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Teaching Performance Data</h3>
                </div>
                <TeachingPerformanceList />
              </TabsContent>

              <TabsContent value="development" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Professional Development</h3>
                </div>
                <ProfessionalDevelopmentList />
              </TabsContent>

              <TabsContent value="impact" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">External Impact</h3>
                </div>
                <ExternalImpactList />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AchievementsPage;
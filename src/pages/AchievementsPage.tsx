import { useState, useMemo } from "react";
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
import { OrcidIntegration } from "@/components/achievements/OrcidIntegration";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Presentation, 
  Mic, 
  Users, 
  GraduationCap, 
  Award, 
  Shield, 
  UserCheck, 
  BarChart3, 
  TrendingUp, 
  Globe,
  Search,
  Sparkles,
  Trophy,
  Star
} from "lucide-react";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface Achievement {
  id: string;
  category: string;
  title: string;
  status: string;
  date?: string;
}

const AchievementsPage = () => {
  const { user } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile();
  const [activeTab, setActiveTab] = useState("publications");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: achievements, refetch: refetchAchievements } = useDataFetching<Achievement>({
    table: "scholastic_achievements",
    enabled: !!user,
  });

  const stats = useMemo(() => {
    const categories: Record<string, number> = {
      publication: 0,
      research_presentation: 0,
      invited_talk: 0,
      leadership_role: 0,
      course_taught: 0,
      award_honor: 0,
      service_review: 0,
      student_supervision: 0,
      teaching_performance: 0,
      professional_development: 0,
      external_impact: 0,
    };

    achievements?.forEach(a => {
      if (categories[a.category] !== undefined) {
        categories[a.category]++;
      }
    });

    return categories;
  }, [achievements]);

  const totalAchievements = Object.values(stats).reduce((a, b) => a + b, 0);

  const tabConfig = [
    { value: "publications", label: "Publications", icon: BookOpen, count: stats.publication },
    { value: "presentations", label: "Research", icon: Presentation, count: stats.research_presentation },
    { value: "talks", label: "Talks", icon: Mic, count: stats.invited_talk },
    { value: "leadership", label: "Leadership", icon: Users, count: stats.leadership_role },
    { value: "courses", label: "Courses", icon: GraduationCap, count: stats.course_taught },
    { value: "awards", label: "Awards", icon: Award, count: stats.award_honor },
    { value: "service", label: "Service", icon: Shield, count: stats.service_review },
    { value: "supervision", label: "Students", icon: UserCheck, count: stats.student_supervision },
    { value: "teaching", label: "Teaching", icon: BarChart3, count: stats.teaching_performance },
    { value: "development", label: "Development", icon: TrendingUp, count: stats.professional_development },
    { value: "impact", label: "Impact", icon: Globe, count: stats.external_impact },
  ];

  const handleRefresh = () => {
    refetchAchievements();
    refetchProfile();
  };

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 text-white">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-xl">
                    <Trophy className="h-10 w-10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-4xl font-bold tracking-tight">Scholastic Achievements</h1>
                      <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
                    </div>
                    <p className="text-white/80 text-lg mt-1">
                      Track and showcase your academic portfolio
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="flex flex-wrap gap-4">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
                  <p className="text-white/70 text-xs uppercase tracking-wider">Total Achievements</p>
                  <p className="text-3xl font-bold">{totalAchievements}</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
                  <p className="text-white/70 text-xs uppercase tracking-wider">Publications</p>
                  <p className="text-3xl font-bold">{stats.publication}</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
                  <p className="text-white/70 text-xs uppercase tracking-wider">Awards</p>
                  <p className="text-3xl font-bold">{stats.award_honor}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ORCID Integration */}
        <OrcidIntegration 
          currentOrcidId={profile?.orcid_id} 
          onRefresh={handleRefresh}
        />

        {/* Main Content with Tabs */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Tab Navigation */}
              <div className="border-b bg-muted/30 p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="overflow-x-auto pb-2 lg:pb-0">
                    <TabsList className="inline-flex h-auto p-1 bg-muted/70 rounded-xl min-w-max">
                      {tabConfig.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all whitespace-nowrap"
                          >
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            {tab.count > 0 && (
                              <Badge 
                                variant="secondary" 
                                className="h-5 min-w-[20px] px-1.5 text-[10px] bg-primary/10 text-primary"
                              >
                                {tab.count}
                              </Badge>
                            )}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </div>

                  <div className="relative w-full lg:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search achievements..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background/50 border-muted-foreground/20"
                    />
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                <TabsContent value="publications" className="mt-0 space-y-4">
                  <PublicationsList />
                </TabsContent>

                <TabsContent value="presentations" className="mt-0 space-y-4">
                  <ResearchPresentationsList />
                </TabsContent>

                <TabsContent value="talks" className="mt-0 space-y-4">
                  <InvitedTalksList />
                </TabsContent>

                <TabsContent value="leadership" className="mt-0 space-y-4">
                  <LeadershipRolesList />
                </TabsContent>

                <TabsContent value="courses" className="mt-0 space-y-4">
                  <CoursesTaughtList />
                </TabsContent>

                <TabsContent value="awards" className="mt-0 space-y-4">
                  <AwardsHonorsList />
                </TabsContent>

                <TabsContent value="service" className="mt-0 space-y-4">
                  <ServiceReviewsList />
                </TabsContent>

                <TabsContent value="supervision" className="mt-0 space-y-4">
                  <StudentSupervisionList />
                </TabsContent>

                <TabsContent value="teaching" className="mt-0 space-y-4">
                  <TeachingPerformanceList />
                </TabsContent>

                <TabsContent value="development" className="mt-0 space-y-4">
                  <ProfessionalDevelopmentList />
                </TabsContent>

                <TabsContent value="impact" className="mt-0 space-y-4">
                  <ExternalImpactList />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AchievementsPage;

import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/MainLayout";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { PageGuide } from "@/components/common/PageGuide";
import { BarChart3, Sparkles, Brain, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AnalyticsPage = () => {
  const { t } = useTranslation();
  return (
    <MainLayout>
      <div className="animate-fade-in space-y-3">
        <PageGuide page="analytics" />
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-xl bg-primary p-3 sm:p-5 text-primary-foreground">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-secondary/20 rounded-full blur-3xl animate-pulse" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            <div className="p-2 rounded-lg bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 shadow-xl shrink-0">
              <BarChart3 className="h-7 w-7 sm:h-9 sm:w-9" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight">{t('analytics.title')}</h1>
                <Badge className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              </div>
              <p className="text-primary-foreground/80 text-xs sm:text-sm">
                Track productivity, analyse trends, and get AI-powered insights across all your academic modules
              </p>
            </div>

            {/* Quick stat pills */}
            <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-foreground/15 border border-primary-foreground/20 text-xs font-medium backdrop-blur-sm">
                <TrendingUp className="h-3.5 w-3.5" />
                Live Data
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-foreground/15 border border-primary-foreground/20 text-xs font-medium backdrop-blur-sm">
                <Brain className="h-3.5 w-3.5" />
                Gemini AI
              </div>
            </div>
          </div>
        </div>

        <AnalyticsDashboard />
      </div>
    </MainLayout>
  );
};

export default AnalyticsPage;

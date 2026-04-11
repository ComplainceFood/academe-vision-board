import { MainLayout } from "@/components/MainLayout";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { BarChart3, Sparkles, Brain, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AnalyticsPage = () => {
  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 md:p-8 text-white shadow-xl">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-secondary/30 blur-2xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-lg shrink-0">
              <BarChart3 className="h-8 w-8 md:h-10 md:w-10" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics & Insights</h1>
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              </div>
              <p className="text-white/80 text-sm md:text-base">
                Track productivity, analyse trends, and get AI-powered insights across all your academic modules
              </p>
            </div>

            {/* Quick stat pills */}
            <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-medium backdrop-blur-sm">
                <TrendingUp className="h-3.5 w-3.5" />
                Live Data
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-medium backdrop-blur-sm">
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

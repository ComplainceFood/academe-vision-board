import { MainLayout } from "@/components/MainLayout";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { BarChart3, TrendingUp, Sparkles } from "lucide-react";

const AnalyticsPage = () => {
  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 p-8 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-xl">
                <BarChart3 className="h-10 w-10" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-4xl font-bold tracking-tight">Analytics & Insights</h1>
                  <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
                </div>
                <p className="text-white/80 text-lg mt-1">
                  Track your productivity, analyze trends, and get insights into your academic activities
                </p>
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
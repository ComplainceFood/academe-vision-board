import { MainLayout } from "@/components/MainLayout";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { BarChart3 } from "lucide-react";

const AnalyticsPage = () => {
  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Analytics & Insights
          </h1>
          <p className="text-muted-foreground">
            Track your productivity, analyze trends, and get insights into your academic activities
          </p>
        </div>

        <AnalyticsDashboard />
      </div>
    </MainLayout>
  );
};

export default AnalyticsPage;
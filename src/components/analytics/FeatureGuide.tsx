import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity,
  Brain,
  Zap
} from "lucide-react";

interface GuideItem {
  icon: any;
  title: string;
  description: string;
  badge?: string;
}

interface FeatureGuideProps {
  activeTab: string;
}

export const FeatureGuide = ({ activeTab }: FeatureGuideProps) => {
  const guides: Record<string, GuideItem[]> = {
    overview: [
      {
        icon: BarChart3,
        title: "Overview Cards",
        description: "Quick summary of your key metrics including total notes, meetings, supplies, expenses, and funding amounts.",
      },
      {
        icon: TrendingUp,
        title: "Time Range Selection",
        description: "Use the dropdown to view data for different time periods (7, 30, or 90 days) to analyze trends over time.",
      },
    ],
    trends: [
      {
        icon: Activity,
        title: "Activity Trends",
        description: "Track your daily activity patterns for notes, meetings, and expenses. Identify peak productivity periods and plan accordingly.",
      },
      {
        icon: TrendingUp,
        title: "Trend Analysis",
        description: "The line chart shows how your academic activities change over time, helping you spot patterns and trends.",
      },
    ],
    distribution: [
      {
        icon: PieChart,
        title: "Activity Distribution",
        description: "See the breakdown of your activities in a pie chart format. Understand where you spend most of your time and resources.",
      },
      {
        icon: BarChart3,
        title: "Weekly Breakdown",
        description: "Compare your activities across the last 7 days with a detailed bar chart showing daily totals.",
      },
    ],
    productivity: [
      {
        icon: Activity,
        title: "Productivity Metrics",
        description: "View your task completion rates over time. Track completed, in-progress, and pending items to optimize your workflow.",
        badge: "Coming Soon"
      },
      {
        icon: TrendingUp,
        title: "Performance Tracking",
        description: "Monitor your productivity trends to identify areas for improvement and celebrate your successes.",
        badge: "Beta"
      },
    ],
    insights: [
      {
        icon: Brain,
        title: "AI-Powered Insights",
        description: "Get personalized recommendations based on your data patterns. Our AI analyzes your activities to suggest improvements.",
      },
      {
        icon: Zap,
        title: "Actionable Recommendations",
        description: "Receive specific, actionable advice to optimize your academic workflow and improve productivity.",
      },
    ],
    actions: [
      {
        icon: Zap,
        title: "Quick Actions",
        description: "Rapidly create new content without navigating through multiple pages. Add notes, schedule meetings, and manage supplies instantly.",
      },
      {
        icon: HelpCircle,
        title: "Contextual Creation",
        description: "Create items directly from the analytics page while maintaining context of your current data insights.",
      },
    ],
  };

  const currentGuide = guides[activeTab] || [];

  if (currentGuide.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-primary">Feature Guide</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentGuide.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
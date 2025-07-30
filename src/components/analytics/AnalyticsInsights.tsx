import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Lightbulb,
  RefreshCw 
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Insight {
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export const AnalyticsInsights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const generateInsights = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      
      setInsights(data?.insights || []);
      toast({
        title: "Insights Generated",
        description: "AI insights have been generated based on your data.",
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive' as const;
      case 'medium':
        return 'default' as const;
      case 'low':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <Button 
            onClick={generateInsights} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Generate Insights
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getPriorityIcon(insight.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <Badge variant={getPriorityVariant(insight.priority)}>
                        {insight.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {insight.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {insight.description}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      Suggested Action: {insight.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No insights generated yet. Click the button above to analyze your data and get personalized recommendations.
            </p>
            <Button onClick={generateInsights} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Generate Insights
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
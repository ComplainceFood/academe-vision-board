import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, RefreshCw, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Insight {
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export const AIInsights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const generateInsights = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Calling generate-insights function...');
      const { data, error } = await supabase.functions.invoke('generate-insights');
      
      console.log('Function response:', { data, error });
      
      if (error) {
        console.error('Function error:', error);
        throw error;
      }
      
      if (!data || !data.insights) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from AI service');
      }
      
      setInsights(data.insights || []);
      toast({
        title: "AI Insights Generated",
        description: `Found ${data.insights?.length || 0} actionable insights`,
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
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-amber-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive' as const;
      case 'medium':
        return 'outline' as const;
      case 'low':
        return 'secondary' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>AI Insights</span>
          </CardTitle>
          <Button 
            onClick={generateInsights}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {loading ? 'Analyzing...' : 'Generate Insights'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(insight.priority)}
                    <h4 className="font-medium">{insight.title}</h4>
                  </div>
                  <Badge variant={getPriorityVariant(insight.priority)}>
                    {insight.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {insight.description}
                </p>
                <div className="bg-muted/30 rounded p-3">
                  <p className="text-sm font-medium text-foreground">
                    💡 Recommended Action:
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {insight.action}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {insight.category}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-2">No insights yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Generate Insights" to get AI-powered recommendations based on your data
            </p>
            <Button onClick={generateInsights} variant="outline">
              <Brain className="h-4 w-4 mr-2" />
              Get AI Insights
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, Calendar, FileText, Users, ShoppingBag, 
  DollarSign, Clock, Target, BarChart3, RefreshCw 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FeatureGuide } from "./FeatureGuide";
import { AnalyticsInsights } from "./AnalyticsInsights";
import { QuickActions } from "./QuickActions";

interface AnalyticsData {
  overview: {
    totalNotes: number;
    totalMeetings: number;
    totalSupplies: number;
    totalExpenses: number;
    totalFunding: number;
    activeProjects: number;
  };
  trends: Array<{
    date: string;
    notes: number;
    meetings: number;
    expenses: number;
  }>;
  categories: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  productivity: Array<{
    week: string;
    completed: number;
    pending: number;
    inProgress: number;
  }>;
}

export const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, timeRange]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      // Fetch overview data
      const [notesResult, meetingsResult, suppliesResult, expensesResult, fundingResult] = await Promise.all([
        supabase.from('notes').select('*', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('meetings').select('*', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('supplies').select('*', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('expenses').select('amount').eq('user_id', user?.id),
        supabase.from('funding_sources').select('total_amount, status').eq('user_id', user?.id),
      ]);

      // Calculate overview metrics
      const overview = {
        totalNotes: notesResult.count || 0,
        totalMeetings: meetingsResult.count || 0,
        totalSupplies: suppliesResult.count || 0,
        totalExpenses: expensesResult.data?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0,
        totalFunding: fundingResult.data?.reduce((sum, fund) => sum + Number(fund.total_amount), 0) || 0,
        activeProjects: fundingResult.data?.filter(fund => fund.status === 'active').length || 0
      };

      // Generate trend data for the selected time range
      const trends = generateTrendData(startDate, endDate, notesResult.data, meetingsResult.data, expensesResult.data);

      // Generate category data
      const categories = [
        { name: 'Notes', value: overview.totalNotes, color: '#8884d8' },
        { name: 'Meetings', value: overview.totalMeetings, color: '#82ca9d' },
        { name: 'Supplies', value: overview.totalSupplies, color: '#ffc658' },
        { name: 'Expenses', value: Math.floor(overview.totalExpenses / 100), color: '#ff7300' },
      ].filter(item => item.value > 0);

      // Generate productivity data
      const productivity = await generateProductivityData();

      setAnalyticsData({
        overview,
        trends,
        categories,
        productivity,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTrendData = (startDate: Date, endDate: Date, notes: any[], meetings: any[], expenses: any[]) => {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const trendData = [];

    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const dayNotes = notes?.filter(note => 
        note.date && note.date.startsWith(dateStr)
      ).length || 0;

      const dayMeetings = meetings?.filter(meeting => 
        meeting.date && meeting.date.startsWith(dateStr)
      ).length || 0;

      const dayExpenses = expenses?.filter(expense => 
        expense.date && expense.date.startsWith(dateStr)
      ).length || 0;

      trendData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        notes: dayNotes,
        meetings: dayMeetings,
        expenses: dayExpenses,
      });
    }

    return trendData;
  };

  const generateProductivityData = async () => {
    try {
      // Fetch planning events (tasks) for the last 4 weeks
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const { data: events } = await supabase
        .from('planning_events')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', fourWeeksAgo.toISOString())
        .eq('type', 'task');

      // Group by weeks
      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));

        const weekEvents = events?.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= weekStart && eventDate <= weekEnd;
        }) || [];

        const completed = weekEvents.filter(event => event.completed).length;
        const pending = weekEvents.filter(event => !event.completed).length;

        weeks.push({
          week: `Week ${4 - i}`,
          completed,
          pending,
          inProgress: 0 // We don't have an in-progress status in our current schema
        });
      }

      return weeks;
    } catch (error) {
      console.error('Error generating productivity data:', error);
      // Fallback to empty data
      return [
        { week: 'Week 1', completed: 0, pending: 0, inProgress: 0 },
        { week: 'Week 2', completed: 0, pending: 0, inProgress: 0 },
        { week: 'Week 3', completed: 0, pending: 0, inProgress: 0 },
        { week: 'Week 4', completed: 0, pending: 0, inProgress: 0 },
      ];
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load analytics data</p>
        <Button onClick={fetchAnalyticsData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">Insights into your academic activities and productivity</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Feature Guide */}
      <FeatureGuide activeTab={activeTab} />

      {/* Quick Actions */}
      <QuickActions />


      {/* Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-2xl font-bold">{analyticsData.overview.totalNotes}</p>
                          <p className="text-sm text-muted-foreground">Notes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold">{analyticsData.overview.totalMeetings}</p>
                          <p className="text-sm text-muted-foreground">Meetings</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-2xl font-bold">{analyticsData.overview.totalSupplies}</p>
                          <p className="text-sm text-muted-foreground">Supplies</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-2xl font-bold">{formatCurrency(analyticsData.overview.totalExpenses)}</p>
                          <p className="text-sm text-muted-foreground">Expenses</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-2xl font-bold">{formatCurrency(analyticsData.overview.totalFunding)}</p>
                          <p className="text-sm text-muted-foreground">Funding</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-indigo-500" />
                        <div>
                          <p className="text-2xl font-bold">{analyticsData.overview.activeProjects}</p>
                          <p className="text-sm text-muted-foreground">Projects</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Activity Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#ccc' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#ccc' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="notes" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    name="Notes"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="meetings" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }}
                    name="Meetings"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2, r: 4 }}
                    name="Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.categories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.trends.slice(-7)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="notes" fill="#8884d8" />
                    <Bar dataKey="meetings" fill="#82ca9d" />
                    <Bar dataKey="expenses" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="productivity">
          <Card>
            <CardHeader>
              <CardTitle>Productivity Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analyticsData.productivity}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#ccc' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#ccc' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stackId="1" 
                    stroke="hsl(var(--chart-1))" 
                    fill="hsl(var(--chart-1))"
                    name="Completed"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="inProgress" 
                    stackId="1" 
                    stroke="hsl(var(--chart-2))" 
                    fill="hsl(var(--chart-2))"
                    name="In Progress"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pending" 
                    stackId="1" 
                    stroke="hsl(var(--chart-3))" 
                    fill="hsl(var(--chart-3))"
                    name="Pending"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <AnalyticsInsights />
        </TabsContent>
      </Tabs>
    </div>
  );
};
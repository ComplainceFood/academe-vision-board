import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertTriangle,
  Plus,
  Receipt,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3
} from "lucide-react";
import { FundingSource, FundingExpenditure } from "@/types/funding";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartPieChart,
  Pie,
  Cell,
} from "recharts";
import { useMemo } from "react";

interface FundingOverviewProps {
  sources: FundingSource[];
  expenditures: FundingExpenditure[];
  isLoading: boolean;
  onAddSource: () => void;
  onAddExpenditure: () => void;
}

export const FundingOverview = ({ 
  sources, 
  expenditures, 
  isLoading,
  onAddSource,
  onAddExpenditure 
}: FundingOverviewProps) => {
  const totalFunding = sources.reduce((sum, source) => sum + source.total_amount, 0);
  const totalRemaining = sources.reduce((sum, source) => sum + source.remaining_amount, 0);
  const totalSpent = totalFunding - totalRemaining;
  const activeSources = sources.filter(source => source.status === 'active');
  const expiringSoon = sources.filter(source => {
    if (!source.end_date) return false;
    const endDate = new Date(source.end_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return endDate <= thirtyDaysFromNow && source.status === 'active';
  });

  const recentExpenditures = expenditures
    .sort((a, b) => new Date(b.expenditure_date).getTime() - new Date(a.expenditure_date).getTime())
    .slice(0, 5);

  // Spending by category for pie chart
  const spendingByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    expenditures.forEach(exp => {
      categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [expenditures]);

  // Monthly spending trend
  const monthlySpending = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      months[key] = 0;
    }
    expenditures.forEach(exp => {
      const d = new Date(exp.expenditure_date);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      if (key in months) {
        months[key] += exp.amount;
      }
    });
    return Object.entries(months).map(([month, amount]) => ({ month, amount }));
  }, [expenditures]);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const spendingPercentage = totalFunding > 0 ? (totalSpent / totalFunding) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-gradient-to-br from-muted/30 to-muted/10">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <div className="relative rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 p-6">
              <Wallet className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2">No grants yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            Start tracking your research grants and funding sources to monitor your budget effectively and stay on top of deadlines.
          </p>
          <Button onClick={onAddSource} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Add Your First Grant
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Total Funding</span>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight">{formatCurrency(totalFunding)}</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 text-emerald-600">
                <ArrowUpRight className="h-3 w-3" />
                {sources.length}
              </span>
              <span>active source{sources.length !== 1 ? 's' : ''}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Available</span>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-600">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-emerald-600">{formatCurrency(totalRemaining)}</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <span className="font-medium">{totalFunding > 0 ? Math.round((totalRemaining / totalFunding) * 100) : 0}%</span>
              <span>of budget remaining</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Total Spent</span>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 text-orange-600">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-orange-600">{formatCurrency(totalSpent)}</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 text-orange-600">
                <ArrowDownRight className="h-3 w-3" />
                {Math.round(spendingPercentage)}%
              </span>
              <span>utilized</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Active Grants</span>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/10 text-violet-600">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight">{activeSources.length}</div>
            {expiringSoon.length > 0 ? (
              <div className="flex items-center gap-1 mt-2 text-xs text-destructive">
                <AlertTriangle className="h-3 w-3" />
                {expiringSoon.length} expiring soon
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <span>All grants on track</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending Trend */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              Spending Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlySpending.length > 0 && expenditures.length > 0 ? (
              <div className="h-[200px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlySpending}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Spent']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorAmount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No spending data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending by Category */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-secondary/10">
                <PieChart className="h-4 w-4 text-secondary" />
              </div>
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {spendingByCategory.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="h-[180px] w-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartPieChart>
                      <Pie
                        data={spendingByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {spendingByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Amount']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </RechartPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {spendingByCategory.slice(0, 5).map((cat, idx) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="capitalize">{cat.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <PieChart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No category data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              Budget Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-semibold">{Math.round(spendingPercentage)}%</span>
              </div>
              <div className="relative h-4 overflow-hidden rounded-full bg-muted">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(spendingPercentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
              {activeSources.slice(0, 6).map((source) => {
                const usage = ((source.total_amount - source.remaining_amount) / source.total_amount) * 100;
                const isHighUsage = usage > 80;
                return (
                  <div key={source.id} className="space-y-2 group">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium truncate max-w-[180px] group-hover:text-primary transition-colors">{source.name}</span>
                      <span className={`text-xs ${isHighUsage ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        {formatCurrency(source.remaining_amount)} left
                      </span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${isHighUsage ? 'bg-gradient-to-r from-destructive to-destructive/70' : 'bg-gradient-to-r from-secondary to-secondary/70'}`}
                        style={{ width: `${Math.min(usage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {activeSources.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <p>No active grants to display</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenditures */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/10">
                  <Receipt className="h-4 w-4 text-orange-600" />
                </div>
                Recent Expenses
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onAddExpenditure} className="gap-1">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentExpenditures.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-orange-500/10 blur-xl rounded-full" />
                  <Receipt className="h-12 w-12 mx-auto relative opacity-50" />
                </div>
                <p className="font-medium">No expenses recorded yet</p>
                <Button variant="link" onClick={onAddExpenditure} className="mt-2">
                  Record your first expense
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {recentExpenditures.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover:text-primary transition-colors">{exp.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(exp.expenditure_date).toLocaleDateString()}
                        <span className="text-muted-foreground/50">•</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{exp.category}</Badge>
                      </div>
                    </div>
                    <div className="text-right pl-4">
                      <span className="font-bold text-orange-600">{formatCurrency(exp.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expiring Soon Alert */}
      {expiringSoon.length > 0 && (
        <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-destructive/10 overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive animate-pulse">
                <Clock className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-destructive mb-3 text-lg">Grants Expiring Soon</h3>
                <div className="space-y-3">
                  {expiringSoon.map((source) => (
                    <div key={source.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-background/50">
                      <span className="font-medium">{source.name}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">
                          Expires: {new Date(source.end_date!).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="text-destructive border-destructive/50 bg-destructive/5">
                          {formatCurrency(source.remaining_amount)} remaining
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

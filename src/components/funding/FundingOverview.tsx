import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertTriangle,
  ArrowRight,
  Plus,
  Receipt,
  Calendar,
  Clock
} from "lucide-react";
import { FundingSource, FundingExpenditure } from "@/types/funding";
import { Skeleton } from "@/components/ui/skeleton";

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
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No grants yet</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            Start tracking your research grants and funding sources to monitor your budget effectively.
          </p>
          <Button onClick={onAddSource} size="lg">
            <Plus className="h-4 w-4 mr-2" />
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
        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total Funding</span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight">{formatCurrency(totalFunding)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {sources.length} source{sources.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-secondary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Available</span>
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-secondary">{formatCurrency(totalRemaining)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalFunding > 0 ? Math.round((totalRemaining / totalFunding) * 100) : 0}% remaining
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total Spent</span>
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-accent">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(spendingPercentage)}% utilized
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-chart-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Active Grants</span>
              <Badge variant={activeSources.length > 0 ? "default" : "secondary"}>
                {activeSources.length}
              </Badge>
            </div>
            <div className="text-3xl font-bold tracking-tight">{activeSources.length}</div>
            {expiringSoon.length > 0 && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {expiringSoon.length} expiring soon
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Budget Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{Math.round(spendingPercentage)}%</span>
              </div>
              <Progress value={spendingPercentage} className="h-3" />
            </div>

            <div className="space-y-4">
              {activeSources.slice(0, 4).map((source) => {
                const usage = ((source.total_amount - source.remaining_amount) / source.total_amount) * 100;
                return (
                  <div key={source.id} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium truncate max-w-[200px]">{source.name}</span>
                      <span className="text-muted-foreground">{formatCurrency(source.remaining_amount)} left</span>
                    </div>
                    <Progress value={usage} className="h-2" />
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
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-accent" />
                Recent Expenses
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onAddExpenditure}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentExpenditures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No expenses recorded yet</p>
                <Button variant="link" onClick={onAddExpenditure} className="mt-2">
                  Record your first expense
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentExpenditures.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{exp.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(exp.expenditure_date).toLocaleDateString()}
                        <span className="text-muted">•</span>
                        <span>{exp.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-accent">{formatCurrency(exp.amount)}</span>
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
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-destructive mb-2">Grants Expiring Soon</h3>
                <div className="space-y-2">
                  {expiringSoon.map((source) => (
                    <div key={source.id} className="flex items-center justify-between text-sm">
                      <span>{source.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Expires: {new Date(source.end_date!).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="text-destructive border-destructive">
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

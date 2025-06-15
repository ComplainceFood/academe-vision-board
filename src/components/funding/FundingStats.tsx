import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { FundingSource } from "@/types/funding";

interface FundingStatsProps {
  sources: FundingSource[];
}

export const FundingStats = ({ sources }: FundingStatsProps) => {
  const totalFunding = sources.reduce((sum, source) => sum + source.total_amount, 0);
  const totalRemaining = sources.reduce((sum, source) => sum + source.remaining_amount, 0);
  const totalSpent = totalFunding - totalRemaining;
  const activeSources = sources.filter(source => source.status === 'active').length;
  const expiringSoon = sources.filter(source => {
    if (!source.end_date) return false;
    const endDate = new Date(source.end_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return endDate <= thirtyDaysFromNow && source.status === 'active';
  }).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const spendingPercentage = totalFunding > 0 ? (totalSpent / totalFunding) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalFunding)}</div>
          <p className="text-xs text-muted-foreground">
            From {sources.length} source{sources.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRemaining)}</div>
          <p className="text-xs text-muted-foreground">
            {totalFunding > 0 ? Math.round((totalRemaining / totalFunding) * 100) : 0}% of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalSpent)}</div>
          <p className="text-xs text-muted-foreground">
            {Math.round(spendingPercentage)}% of total funding
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Sources</CardTitle>
          <Badge variant={activeSources > 0 ? "default" : "secondary"}>
            {activeSources}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeSources}</div>
          {expiringSoon > 0 && (
            <p className="text-xs text-orange-600">
              {expiringSoon} expiring within 30 days
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
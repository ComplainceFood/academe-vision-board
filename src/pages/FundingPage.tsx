import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, AlertCircle, Plus } from "lucide-react";
import { FundingSourcesList } from "@/components/funding/FundingSourcesList";
import { ExpendituresList } from "@/components/funding/ExpendituresList";
import { FundingStats } from "@/components/funding/FundingStats";
import { FundingSourceDialog } from "@/components/funding/FundingSourceDialog";
import { ExpenditureDialog } from "@/components/funding/ExpenditureDialog";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useAuth } from "@/hooks/useAuth";
import { FundingSource, FundingExpenditure } from "@/types/funding";

const FundingPage = () => {
  const { user } = useAuth();
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [showExpenditureDialog, setShowExpenditureDialog] = useState(false);

  const { data: fundingSources, isLoading: sourcesLoading, refetch: refetchSources } = useDataFetching<FundingSource>({
    table: 'funding_sources',
    enabled: !!user
  });

  const { data: expenditures, isLoading: expendituresLoading, refetch: refetchExpenditures } = useDataFetching<FundingExpenditure>({
    table: 'funding_expenditures',
    enabled: !!user
  });

  const handleSuccess = () => {
    refetchSources();
    refetchExpenditures();
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-green-600" />
            Funding Management
          </h1>
          <p className="text-muted-foreground">
            Track funding sources, manage expenditures, and monitor your financial resources
          </p>
        </div>

        {/* Funding Statistics */}
        <div className="mb-8">
          <FundingStats sources={fundingSources} />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => setShowSourceDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Funding Source
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowExpenditureDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Record Expenditure
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="sources" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sources" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Funding Sources
            </TabsTrigger>
            <TabsTrigger value="expenditures" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Expenditures
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="space-y-6">
            <FundingSourcesList 
              sources={fundingSources}
              isLoading={sourcesLoading}
              onRefetch={handleSuccess}
            />
          </TabsContent>

          <TabsContent value="expenditures" className="space-y-6">
            <ExpendituresList 
              expenditures={expenditures}
              isLoading={expendituresLoading}
              onRefetch={handleSuccess}
            />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <FundingSourceDialog
          open={showSourceDialog}
          onOpenChange={setShowSourceDialog}
          onSuccess={() => {
            setShowSourceDialog(false);
            handleSuccess();
          }}
        />

        <ExpenditureDialog
          open={showExpenditureDialog}
          onOpenChange={setShowExpenditureDialog}
          onSuccess={() => {
            setShowExpenditureDialog(false);
            handleSuccess();
          }}
        />
      </div>
    </MainLayout>
  );
};

export default FundingPage;
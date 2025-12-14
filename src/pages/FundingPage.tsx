import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  Plus,
  Wallet,
  PiggyBank
} from "lucide-react";
import { FundingSourcesList } from "@/components/funding/FundingSourcesList";
import { ExpendituresList } from "@/components/funding/ExpendituresList";
import { FundingOverview } from "@/components/funding/FundingOverview";
import { FundingSourceDialog } from "@/components/funding/FundingSourceDialog";
import { ExpenditureDialog } from "@/components/funding/ExpenditureDialog";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useAuth } from "@/hooks/useAuth";
import { FundingSource, FundingExpenditure } from "@/types/funding";

const FundingPage = () => {
  const { user } = useAuth();
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [showExpenditureDialog, setShowExpenditureDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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
      <div className="animate-fade-in space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-secondary p-8 text-primary-foreground">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <PiggyBank className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Grant Management</h1>
                    <p className="text-primary-foreground/80">
                      Track research grants, funding sources & expenditures
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => setShowSourceDialog(true)}
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-primary-foreground border-white/20"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Grant
                </Button>
                <Button 
                  onClick={() => setShowExpenditureDialog(true)}
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-primary-foreground border-white/20"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Record Expense
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 p-1 bg-muted/50">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sources" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Grants</span>
            </TabsTrigger>
            <TabsTrigger 
              value="expenditures" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Expenses</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <FundingOverview 
              sources={fundingSources}
              expenditures={expenditures}
              isLoading={sourcesLoading || expendituresLoading}
              onAddSource={() => setShowSourceDialog(true)}
              onAddExpenditure={() => setShowExpenditureDialog(true)}
            />
          </TabsContent>

          <TabsContent value="sources" className="space-y-6 mt-6">
            <FundingSourcesList 
              sources={fundingSources}
              isLoading={sourcesLoading}
              onRefetch={handleSuccess}
            />
          </TabsContent>

          <TabsContent value="expenditures" className="space-y-6 mt-6">
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

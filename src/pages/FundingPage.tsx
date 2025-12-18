import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  Plus,
  Wallet,
  PiggyBank,
  Search,
  Sparkles
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
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter sources and expenditures based on search
  const filteredSources = fundingSources.filter(source => 
    source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpenditures = expenditures.filter(exp => 
    exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-xl">
                    <PiggyBank className="h-10 w-10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-4xl font-bold tracking-tight">Grant Management</h1>
                      <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
                    </div>
                    <p className="text-white/80 text-lg mt-1">
                      Track research grants, funding sources & expenditures
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => setShowSourceDialog(true)}
                  size="lg"
                  className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm shadow-lg transition-all hover:scale-105"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Grant
                </Button>
                <Button 
                  onClick={() => setShowExpenditureDialog(true)}
                  size="lg"
                  className="bg-white text-emerald-700 hover:bg-white/90 shadow-lg transition-all hover:scale-105"
                >
                  <Receipt className="h-5 w-5 mr-2" />
                  Record Expense
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="p-1.5 bg-muted/70 backdrop-blur-sm rounded-xl">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="sources" 
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
              >
                <Wallet className="h-4 w-4" />
                <span>Grants</span>
              </TabsTrigger>
              <TabsTrigger 
                value="expenditures" 
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
              >
                <DollarSign className="h-4 w-4" />
                <span>Expenses</span>
              </TabsTrigger>
            </TabsList>

            {activeTab !== "overview" && (
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${activeTab === 'sources' ? 'grants' : 'expenses'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-muted-foreground/20"
                />
              </div>
            )}
          </div>

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
              sources={filteredSources}
              isLoading={sourcesLoading}
              onRefetch={handleSuccess}
            />
          </TabsContent>

          <TabsContent value="expenditures" className="space-y-6 mt-6">
            <ExpendituresList 
              expenditures={filteredExpenditures}
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

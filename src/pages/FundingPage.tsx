import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Plus,
  Wallet,
  PiggyBank,
  Search,
  Sparkles,
  CalendarCheck,
  StickyNote,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { FundingSourcesList } from "@/components/funding/FundingSourcesList";
import { ExpendituresList } from "@/components/funding/ExpendituresList";
import { FundingOverview } from "@/components/funding/FundingOverview";
import { FundingSourceDialog } from "@/components/funding/FundingSourceDialog";
import { ExpenditureDialog } from "@/components/funding/ExpenditureDialog";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useAuth } from "@/hooks/useAuth";
import { FundingSource, FundingExpenditure } from "@/types/funding";
import { GrantMeetingsList } from "@/components/funding/GrantMeetingsList";
import { GrantNotesList } from "@/components/funding/GrantNotesList";
import { GrantAINarrative } from "@/components/funding/GrantAINarrative";

type TabId = "overview" | "sources" | "expenditures" | "grant-meetings" | "grant-notes" | "ai-narrative";

const NAV_ITEMS: { id: TabId; label: string; icon: React.ElementType; description: string }[] = [
  { id: "overview",       label: "Overview",       icon: TrendingUp,    description: "Budget summary & charts" },
  { id: "sources",        label: "Grants",         icon: Wallet,        description: "Funding sources" },
  { id: "expenditures",   label: "Expenses",       icon: DollarSign,    description: "Track spending" },
  { id: "grant-meetings", label: "Meetings",       icon: CalendarCheck, description: "Grant-linked meetings" },
  { id: "grant-notes",    label: "Notes",          icon: StickyNote,    description: "Grant notes & logs" },
  { id: "ai-narrative",   label: "AI Narrative",   icon: Sparkles,      description: "Generate reports with AI" },
];

const FundingPage = () => {
  const { user } = useAuth();
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [showExpenditureDialog, setShowExpenditureDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [navCollapsed, setNavCollapsed] = useState(typeof window !== 'undefined' && window.innerWidth < 640);

  const { data: fundingSources, isLoading: sourcesLoading, refetch: refetchSources } = useDataFetching<FundingSource>({
    table: 'funding_sources',
    enabled: !!user,
  });

  const { data: expenditures, isLoading: expendituresLoading, refetch: refetchExpenditures } = useDataFetching<FundingExpenditure>({
    table: 'funding_expenditures',
    enabled: !!user,
  });

  const handleSuccess = () => {
    refetchSources();
    refetchExpenditures();
  };

  const filteredSources = fundingSources.filter(source =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (source.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const filteredExpenditures = expenditures.filter(exp =>
    exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showSearch = activeTab === "sources" || activeTab === "expenditures";
  const activeNav = NAV_ITEMS.find(n => n.id === activeTab)!;

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">

        {/* ── Hero Header ── */}
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/10 rounded-full blur-3xl animate-pulse" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-xl">
                <PiggyBank className="h-10 w-10" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Grant Management</h1>
                  <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
                </div>
                <p className="text-primary-foreground/80 text-lg mt-1">
                  Track research grants, funding sources &amp; expenditures
                </p>
              </div>
            </div>

            {/* Header action buttons — clearly visible */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowSourceDialog(true)}
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg transition-all hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Grant
              </Button>
              <Button
                onClick={() => setShowExpenditureDialog(true)}
                size="lg"
                variant="outline"
                className="border-white/60 text-white hover:bg-white/15 font-semibold shadow-lg transition-all hover:scale-105 bg-white/10 backdrop-blur-sm"
              >
                <Receipt className="h-5 w-5 mr-2" />
                Record Expense
              </Button>
            </div>
          </div>
        </div>

        {/* ── Page body: collapsible side-nav + content ── */}
        <div className="flex gap-4 items-start">

          {/* Collapsible vertical nav */}
          <aside
            className={cn(
              "shrink-0 transition-all duration-300 ease-in-out",
              navCollapsed ? "w-14" : "w-52"
            )}
          >
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              {/* Toggle button */}
              <div className="flex items-center justify-between px-3 py-3 border-b bg-muted/40">
                {!navCollapsed && (
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                    Navigation
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7 rounded-lg hover:bg-primary/10", navCollapsed && "mx-auto")}
                  onClick={() => setNavCollapsed(prev => !prev)}
                  title={navCollapsed ? "Expand navigation" : "Collapse navigation"}
                >
                  {navCollapsed
                    ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    : <ChevronLeft className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>

              {/* Nav items */}
              <nav className="p-2 space-y-0.5">
                {NAV_ITEMS.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      title={navCollapsed ? item.label : undefined}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-all duration-150 text-left group",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      {!navCollapsed && (
                        <div className="min-w-0">
                          <div className={cn("truncate leading-tight", isActive ? "text-primary-foreground" : "")}>
                            {item.label}
                          </div>
                          <div className={cn(
                            "text-[10px] truncate leading-tight mt-0.5",
                            isActive ? "text-primary-foreground/70" : "text-muted-foreground/60"
                          )}>
                            {item.description}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Content area */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Content header: breadcrumb + search */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <activeNav.icon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{activeNav.label}</h2>
                <span className="text-sm text-muted-foreground hidden sm:inline">— {activeNav.description}</span>
              </div>
              {showSearch && (
                <div className="relative w-full sm:w-64">
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

            {/* Tab content panels */}
            {activeTab === "overview" && (
              <FundingOverview
                sources={fundingSources}
                expenditures={expenditures}
                isLoading={sourcesLoading || expendituresLoading}
                onAddSource={() => setShowSourceDialog(true)}
                onAddExpenditure={() => setShowExpenditureDialog(true)}
              />
            )}

            {activeTab === "sources" && (
              <FundingSourcesList
                sources={filteredSources}
                isLoading={sourcesLoading}
                onRefetch={handleSuccess}
              />
            )}

            {activeTab === "expenditures" && (
              <ExpendituresList
                expenditures={filteredExpenditures}
                isLoading={expendituresLoading}
                onRefetch={handleSuccess}
              />
            )}

            {activeTab === "grant-meetings" && (
              <GrantMeetingsList
                sources={fundingSources}
                isLoading={sourcesLoading}
              />
            )}

            {activeTab === "grant-notes" && (
              <GrantNotesList
                sources={fundingSources}
                isLoading={sourcesLoading}
              />
            )}

            {activeTab === "ai-narrative" && (
              <GrantAINarrative sources={fundingSources} />
            )}
          </div>
        </div>

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

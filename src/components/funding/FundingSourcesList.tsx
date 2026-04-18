import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Plus,
  Trash2,
  Calendar,
  User,
  Mail,
  MoreVertical,
  Wallet,
  AlertTriangle,
  BookOpen,
  Gift,
  BarChart3,
  Handshake,
  DollarSign,
  Eye,
  X,
  FileText,
  Lock,
  ClipboardList,
  TrendingDown,
} from "lucide-react";
import { FundingSource } from "@/types/funding";
import { FundingSourceDialog } from "./FundingSourceDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface FundingSourcesListProps {
  sources: FundingSource[];
  isLoading: boolean;
  onRefetch: () => void;
}

const GrantViewDialog = ({ source, onClose }: { source: FundingSource; onClose: () => void }) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const usagePercentage = Math.round(((source.total_amount - source.remaining_amount) / source.total_amount) * 100);
  const isHighUsage = usagePercentage > 80;

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold leading-snug">{source.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Budget overview */}
          <div className="rounded-xl bg-muted/50 border p-4 space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Remaining Budget</p>
                <p className={`text-2xl font-bold tabular-nums ${isHighUsage ? 'text-destructive' : ''}`}>
                  {formatCurrency(source.remaining_amount)}
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>of {formatCurrency(source.total_amount)} total</p>
                <p className="font-medium">{usagePercentage}% used</p>
              </div>
            </div>
            <Progress value={Math.min(usagePercentage, 100)} className={`h-2 ${isHighUsage ? '[&>div]:bg-destructive' : ''}`} />
            <div className="flex gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Spent: {formatCurrency(source.total_amount - source.remaining_amount)}</span>
            </div>
          </div>

          <Separator />

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Type</p>
              <p className="font-medium capitalize">{source.type.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Status</p>
              <p className="font-medium capitalize">{source.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</p>
              <p className="font-medium">{fmtDate(source.start_date)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Calendar className="h-3 w-3" /> End Date</p>
              <p className="font-medium">{fmtDate(source.end_date)}</p>
            </div>
            {source.contact_person && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><User className="h-3 w-3" /> Contact</p>
                <p className="font-medium">{source.contact_person}</p>
              </div>
            )}
            {source.contact_email && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Mail className="h-3 w-3" /> Email</p>
                <p className="font-medium break-all">{source.contact_email}</p>
              </div>
            )}
          </div>

          {source.description && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Description
                </p>
                <p className="text-sm leading-relaxed">{source.description}</p>
              </div>
            </>
          )}

          {source.restrictions && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Lock className="h-3 w-3" /> Restrictions
              </p>
              <p className="text-sm leading-relaxed">{source.restrictions}</p>
            </div>
          )}

          {source.reporting_requirements && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <ClipboardList className="h-3 w-3" /> Reporting Requirements
              </p>
              <p className="text-sm leading-relaxed">{source.reporting_requirements}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const FundingSourcesList = ({ sources, isLoading, onRefetch }: FundingSourcesListProps) => {
  const [editingSource, setEditingSource] = useState<FundingSource | null>(null);
  const [viewingSource, setViewingSource] = useState<FundingSource | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<FundingSource | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleDelete = async () => {
    if (!sourceToDelete) return;
    
    try {
      const { error } = await supabase
        .from('funding_sources')
        .delete()
        .eq('id', sourceToDelete.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Funding source deleted successfully",
      });
      
      onRefetch();
    } catch (error) {
      console.error("Error deleting funding source:", error);
      toast({
        title: "Error",
        description: "Failed to delete funding source",
        variant: "destructive",
      });
    } finally {
      setSourceToDelete(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Active', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' };
      case 'expired': return { label: 'Expired', className: 'bg-muted text-muted-foreground' };
      case 'depleted': return { label: 'Depleted', className: 'bg-destructive/10 text-destructive border-destructive/30' };
      case 'pending': return { label: 'Pending', className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' };
      default: return { label: status, className: '' };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'grant': return { Icon: BookOpen, label: 'Grant' };
      case 'donation': return { Icon: Gift, label: 'Donation' };
      case 'budget_allocation': return { Icon: BarChart3, label: 'Budget Allocation' };
      case 'fundraising': return { Icon: Handshake, label: 'Fundraising' };
      default: return { Icon: DollarSign, label: 'Other' };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateUsagePercentage = (total: number, remaining: number) => {
    return Math.round(((total - remaining) / total) * 100);
  };

  const getDaysUntilExpiry = (endDate: string | undefined) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="h-3 w-full" />
                <div className="p-5">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-full mb-4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
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
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
            <div className="relative rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-6">
              <Wallet className="h-12 w-12 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2">{t('funding.noFundingSources')}</h3>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            {t('funding.noFundingSourcesDesc')}
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            {t('funding.addFundingSource')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {viewingSource && (
        <GrantViewDialog source={viewingSource} onClose={() => setViewingSource(null)} />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">{t('funding.allGrants')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{sources.length} funding source{sources.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('funding.addGrant')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sources.map((source) => {
          const usagePercentage = calculateUsagePercentage(source.total_amount, source.remaining_amount);
          const statusCfg = getStatusConfig(source.status);
          const typeConfig = getTypeConfig(source.type);
          const daysUntilExpiry = getDaysUntilExpiry(source.end_date);
          const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
          const isHighUsage = usagePercentage > 80;
          const { Icon: TypeIcon } = typeConfig;

          // Color accent per status
          const accentColor = {
            active: "from-emerald-500/20 to-teal-500/10 border-emerald-500/20",
            pending: "from-amber-500/15 to-yellow-500/10 border-amber-500/20",
            expired: "from-muted/40 to-muted/20 border-border",
            depleted: "from-destructive/10 to-destructive/5 border-destructive/20",
          }[source.status] ?? "from-muted/30 to-muted/10 border-border";

          const iconBg = {
            active: "bg-emerald-500/15 text-emerald-600",
            pending: "bg-amber-500/15 text-amber-600",
            expired: "bg-muted text-muted-foreground",
            depleted: "bg-destructive/10 text-destructive",
          }[source.status] ?? "bg-muted text-muted-foreground";

          return (
            <Card
              key={source.id}
              className={`group relative overflow-hidden border bg-gradient-to-br ${accentColor} hover:shadow-lg transition-all duration-200 cursor-pointer`}
              onClick={() => setViewingSource(source)}
            >
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`rounded-xl p-2.5 shrink-0 ${iconBg}`}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base leading-snug line-clamp-2">{source.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{typeConfig.label}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Badge variant="outline" className={`text-xs ${statusCfg.className}`}>
                      {statusCfg.label}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingSource(source)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setEditingSource(source);
                          setIsEditDialogOpen(true);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSourceToDelete(source)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Budget ring / amounts */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Remaining</p>
                    <p className={`text-2xl font-bold tabular-nums ${isHighUsage ? 'text-destructive' : ''}`}>
                      {formatCurrency(source.remaining_amount)}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>of {formatCurrency(source.total_amount)}</p>
                    <p className={`font-semibold text-sm ${isHighUsage ? 'text-destructive' : ''}`}>{usagePercentage}% used</p>
                  </div>
                </div>

                {/* Progress bar */}
                <Progress
                  value={Math.min(usagePercentage, 100)}
                  className={`h-2 ${isHighUsage ? '[&>div]:bg-destructive' : source.status === 'active' ? '[&>div]:bg-emerald-500' : ''}`}
                />

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-between gap-y-1 pt-1 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(source.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      {source.end_date && (
                        <> – {new Date(source.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {source.contact_person && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {source.contact_person}
                      </span>
                    )}
                    {isExpiringSoon && (
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        {daysUntilExpiry}d left
                      </span>
                    )}
                  </div>
                </div>

                {/* View hint on hover */}
                <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Click to view
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <FundingSourceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          onRefetch();
          setIsAddDialogOpen(false);
        }}
      />

      <FundingSourceDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingSource={editingSource}
        onSuccess={() => {
          onRefetch();
          setIsEditDialogOpen(false);
          setEditingSource(null);
        }}
      />

      <AlertDialog open={!!sourceToDelete} onOpenChange={(open: boolean) => !open && setSourceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('funding.deleteGrant')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('funding.deleteGrantConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

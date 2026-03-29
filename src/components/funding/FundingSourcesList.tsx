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
  MoreVertical,
  Wallet,
  AlertTriangle,
  BookOpen,
  Gift,
  BarChart3,
  Handshake,
  DollarSign,
} from "lucide-react";
import { FundingSource } from "@/types/funding";
import { FundingSourceDialog } from "./FundingSourceDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface FundingSourcesListProps {
  sources: FundingSource[];
  isLoading: boolean;
  onRefetch: () => void;
}

export const FundingSourcesList = ({ sources, isLoading, onRefetch }: FundingSourcesListProps) => {
  const [editingSource, setEditingSource] = useState<FundingSource | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<FundingSource | null>(null);
  const { toast } = useToast();

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
          <h3 className="text-2xl font-bold mb-2">No funding sources yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            Add your first funding source to start tracking your grants and budgets effectively.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Add Funding Source
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">All Grants</h2>
          <p className="text-sm text-muted-foreground mt-1">{sources.length} funding source{sources.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Grant
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sources.map((source) => {
          const usagePercentage = calculateUsagePercentage(source.total_amount, source.remaining_amount);
          const statusConfig = getStatusConfig(source.status);
          const typeConfig = getTypeConfig(source.type);
          const daysUntilExpiry = getDaysUntilExpiry(source.end_date);
          const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
          const isHighUsage = usagePercentage > 80;
          const { Icon: TypeIcon } = typeConfig;

          return (
            <Card
              key={source.id}
              className="group hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              <CardContent className="p-5 space-y-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="mt-0.5 rounded-md bg-muted p-2 shrink-0">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base leading-snug line-clamp-2">{source.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{typeConfig.label}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="outline" className={`text-xs ${statusConfig.className}`}>
                      {statusConfig.label}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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

                {/* Budget amounts */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Remaining</p>
                    <p className={`text-xl font-semibold tabular-nums ${isHighUsage ? 'text-destructive' : ''}`}>
                      {formatCurrency(source.remaining_amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-0.5">of {formatCurrency(source.total_amount)}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">{usagePercentage}% used</p>
                  </div>
                </div>

                {/* Progress bar */}
                <Progress
                  value={Math.min(usagePercentage, 100)}
                  className={`h-1.5 ${isHighUsage ? '[&>div]:bg-destructive' : ''}`}
                />

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-between gap-y-1 pt-1 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(source.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      {source.end_date && (
                        <> &ndash; {new Date(source.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</>
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
            <AlertDialogTitle>Delete Funding Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{sourceToDelete?.name}"? This action cannot be undone and will also delete all associated expenditures.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

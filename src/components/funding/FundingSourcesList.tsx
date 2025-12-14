import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Edit, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Mail,
  MoreVertical,
  Wallet,
  TrendingUp
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
      case 'active': return { variant: 'default' as const, className: 'bg-secondary text-secondary-foreground' };
      case 'expired': return { variant: 'secondary' as const, className: '' };
      case 'depleted': return { variant: 'destructive' as const, className: '' };
      case 'pending': return { variant: 'outline' as const, className: '' };
      default: return { variant: 'default' as const, className: '' };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'grant': return '🎓';
      case 'donation': return '🎁';
      case 'budget_allocation': return '📊';
      case 'fundraising': return '🤝';
      default: return '💰';
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-3 w-full mb-4" />
                <Skeleton className="h-4 w-2/3" />
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
          <h3 className="text-xl font-semibold mb-2">No funding sources yet</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            Add your first funding source to start tracking your grants and budgets.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Funding Source
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">All Grants</h2>
          <p className="text-sm text-muted-foreground">{sources.length} funding source{sources.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Grant
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sources.map((source) => {
          const usagePercentage = calculateUsagePercentage(source.total_amount, source.remaining_amount);
          const statusConfig = getStatusConfig(source.status);
          
          return (
            <Card 
              key={source.id} 
              className="group hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <CardContent className="p-0">
                {/* Header */}
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-2xl">{getTypeIcon(source.type)}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base leading-tight line-clamp-2">{source.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{source.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
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

                  <div className="flex gap-2 mt-3">
                    <Badge variant={statusConfig.variant} className={statusConfig.className}>
                      {source.status}
                    </Badge>
                  </div>
                </div>

                {/* Budget Progress */}
                <div className="px-5 pb-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Utilized</span>
                      <span className="font-medium">{usagePercentage}%</span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Total</p>
                      <p className="font-semibold text-sm">{formatCurrency(source.total_amount)}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/10">
                      <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                      <p className="font-semibold text-sm text-secondary">{formatCurrency(source.remaining_amount)}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="px-5 py-3 bg-muted/30 border-t space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(source.start_date).toLocaleDateString()}</span>
                    {source.end_date && (
                      <>
                        <span>→</span>
                        <span>{new Date(source.end_date).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                  {source.contact_person && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{source.contact_person}</span>
                    </div>
                  )}
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

      <AlertDialog open={!!sourceToDelete} onOpenChange={(open) => !open && setSourceToDelete(null)}>
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

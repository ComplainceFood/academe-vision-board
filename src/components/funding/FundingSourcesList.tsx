import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Edit, Plus } from "lucide-react";
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'expired': return 'secondary';
      case 'depleted': return 'destructive';
      case 'pending': return 'outline';
      default: return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateUsagePercentage = (total: number, remaining: number) => {
    return Math.round(((total - remaining) / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium">No funding sources yet</h3>
            <p className="text-muted-foreground">
              Add your first funding source to start tracking your funds.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Funding Source
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sources.map((source) => {
          const usagePercentage = calculateUsagePercentage(source.total_amount, source.remaining_amount);
          
          return (
            <Card key={source.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">{source.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingSource(source);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSourceToDelete(source)}
                      className="text-destructive hover:text-destructive"
                    >
                      ×
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={getStatusColor(source.status)}>
                    {source.status}
                  </Badge>
                  <Badge variant="outline">
                    {getTypeLabel(source.type)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Usage</span>
                    <span>{usagePercentage}%</span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{formatCurrency(source.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(source.remaining_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Used:</span>
                    <span className="font-medium text-orange-600">
                      {formatCurrency(source.total_amount - source.remaining_amount)}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <div>Start: {new Date(source.start_date).toLocaleDateString()}</div>
                  {source.end_date && (
                    <div>End: {new Date(source.end_date).toLocaleDateString()}</div>
                  )}
                </div>
                
                {source.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {source.description}
                  </p>
                )}
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
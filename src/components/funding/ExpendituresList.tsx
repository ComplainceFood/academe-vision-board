import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Plus,
  Trash2,
  Calendar,
  Receipt,
  MoreVertical,
  FileText,
  DollarSign,
  ArrowDownRight,
  Paperclip,
} from "lucide-react";
import { FundingExpenditure } from "@/types/funding";
import { ExpenditureDialog } from "./ExpenditureDialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExpendituresListProps {
  expenditures: FundingExpenditure[];
  isLoading: boolean;
  onRefetch: () => void;
}

export const ExpendituresList = ({ expenditures, isLoading, onRefetch }: ExpendituresListProps) => {
  const [editingExpenditure, setEditingExpenditure] = useState<FundingExpenditure | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [expenditureToDelete, setExpenditureToDelete] = useState<FundingExpenditure | null>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!expenditureToDelete) return;

    try {
      // Delete receipt file from storage if one exists
      if (expenditureToDelete.receipt_url) {
        await supabase.storage.from('receipts').remove([expenditureToDelete.receipt_url]);
      }

      const { error } = await supabase
        .from('funding_expenditures')
        .delete()
        .eq('id', expenditureToDelete.id);

      if (error) throw error;

      toast({ title: "Success", description: "Expenditure deleted successfully" });
      onRefetch();
    } catch (error) {
      console.error("Error deleting expenditure:", error);
      toast({ title: "Error", description: "Failed to delete expenditure", variant: "destructive" });
    } finally {
      setExpenditureToDelete(null);
    }
  };

  const handleViewReceipt = async (expenditure: FundingExpenditure) => {
    if (!expenditure.receipt_url) return;
    const { data, error } = await supabase.storage
      .from('receipts')
      .createSignedUrl(expenditure.receipt_url, 3600);
    if (error) {
      toast({ title: "Error", description: "Could not load receipt", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryConfig = (category: string) => {
    const configs: Record<string, { color: string; bg: string }> = {
      'equipment': { color: 'text-violet-600', bg: 'bg-violet-500/10 border-violet-500/30' },
      'supplies': { color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/30' },
      'travel': { color: 'text-blue-600', bg: 'bg-blue-500/10 border-blue-500/30' },
      'personnel': { color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/30' },
      'services': { color: 'text-pink-600', bg: 'bg-pink-500/10 border-pink-500/30' },
    };
    return configs[category.toLowerCase()] || { color: 'text-muted-foreground', bg: 'bg-muted' };
  };

  const totalAmount = expenditures.reduce((sum, exp) => sum + exp.amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardContent className="pt-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 py-4 border-b last:border-0">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (expenditures.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-gradient-to-br from-muted/30 to-muted/10">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full" />
            <div className="relative rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 p-6">
              <Receipt className="h-12 w-12 text-orange-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2">No expenses recorded</h3>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            Start tracking your grant expenditures to monitor your spending and stay within budget.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Record First Expense
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">All Expenses</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-muted-foreground">
              {expenditures.length} transaction{expenditures.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
              <ArrowDownRight className="h-4 w-4" />
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Record Expense
        </Button>
      </div>
      
      <Card className="overflow-hidden border-0 shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Grant</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Receipt</TableHead>
                  <TableHead className="text-right font-semibold">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenditures.map((expenditure, idx) => {
                  const categoryConfig = getCategoryConfig(expenditure.category);
                  return (
                    <TableRow 
                      key={expenditure.id} 
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium group-hover:text-primary transition-colors">{expenditure.description}</p>
                          {expenditure.receipt_number && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              {expenditure.receipt_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {expenditure.funding_source?.name || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${categoryConfig.bg} ${categoryConfig.color} capitalize`}>
                          {expenditure.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(expenditure.expenditure_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {expenditure.receipt_url ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-primary hover:text-primary gap-1"
                            onClick={() => handleViewReceipt(expenditure)}
                          >
                            <Paperclip className="h-3 w-3" />
                            View
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-orange-600">{formatCurrency(expenditure.amount)}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingExpenditure(expenditure);
                              setIsEditDialogOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setExpenditureToDelete(expenditure)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ExpenditureDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          onRefetch();
          setIsAddDialogOpen(false);
        }}
      />

      <ExpenditureDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingExpenditure={editingExpenditure}
        onSuccess={() => {
          onRefetch();
          setIsEditDialogOpen(false);
          setEditingExpenditure(null);
        }}
      />

      <AlertDialog open={!!expenditureToDelete} onOpenChange={(open) => !open && setExpenditureToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expenditure</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expenditure record? This action cannot be undone.
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

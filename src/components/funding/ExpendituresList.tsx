import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  User,
  Tag
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
      const { error } = await supabase
        .from('funding_expenditures')
        .delete()
        .eq('id', expenditureToDelete.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Expenditure deleted successfully",
      });
      
      onRefetch();
    } catch (error) {
      console.error("Error deleting expenditure:", error);
      toast({
        title: "Error",
        description: "Failed to delete expenditure",
        variant: "destructive",
      });
    } finally {
      setExpenditureToDelete(null);
    }
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'equipment': 'bg-chart-1/10 text-chart-1',
      'supplies': 'bg-chart-2/10 text-chart-2',
      'travel': 'bg-chart-3/10 text-chart-3',
      'personnel': 'bg-chart-4/10 text-chart-4',
      'services': 'bg-chart-5/10 text-chart-5',
    };
    return colors[category.toLowerCase()] || 'bg-muted text-muted-foreground';
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
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Receipt className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No expenses recorded</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            Start tracking your grant expenditures to monitor your spending.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
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
          <h2 className="text-xl font-semibold">All Expenses</h2>
          <p className="text-sm text-muted-foreground">
            {expenditures.length} transaction{expenditures.length !== 1 ? 's' : ''} • Total: {formatCurrency(totalAmount)}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record Expense
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Description</TableHead>
                  <TableHead>Grant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenditures.map((expenditure) => (
                  <TableRow key={expenditure.id} className="group hover:bg-muted/30">
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{expenditure.description}</p>
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
                      <Badge variant="secondary" className={getCategoryColor(expenditure.category)}>
                        {expenditure.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(expenditure.expenditure_date)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-accent">{formatCurrency(expenditure.amount)}</span>
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
                ))}
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

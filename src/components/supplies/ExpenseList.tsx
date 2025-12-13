
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowUpDown, CheckCircle, FileText, MoreVertical, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRefreshContext } from "@/App";
import { ExpenseCsvManager } from "./ExpenseCsvManager";

interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  course: string;
  receipt?: boolean;
}

interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
  onDeleteExpense: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onRefetch?: () => void;
}

export const ExpenseList = ({ 
  expenses,
  isLoading,
  onDeleteExpense,
  onBulkDelete,
  onRefetch
}: ExpenseListProps) => {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>('date-desc');
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExpenses(expenses.map(expense => expense.id));
    } else {
      setSelectedExpenses([]);
    }
  };

  const handleSelectExpense = (expenseId: string, checked: boolean) => {
    if (checked) {
      setSelectedExpenses(prev => [...prev, expenseId]);
    } else {
      setSelectedExpenses(prev => prev.filter(id => id !== expenseId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedExpenses.length === 0 || !onBulkDelete) return;
    onBulkDelete(selectedExpenses);
    setSelectedExpenses([]);
  };
  
  // New expense form state
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    category: 'Supplies',
    course: 'General',
    receipt: false,
    date: new Date().toISOString().split('T')[0]
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { triggerRefresh } = useRefreshContext();

  // Sort expenses based on selected order
  const sortedExpenses = React.useMemo(() => {
    const sorted = [...expenses];
    
    switch(sortOrder) {
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'amount-desc':
        return sorted.sort((a, b) => b.amount - a.amount);
      case 'amount-asc':
        return sorted.sort((a, b) => a.amount - b.amount);
      case 'category':
        return sorted.sort((a, b) => a.category.localeCompare(b.category));
      case 'course':
        return sorted.sort((a, b) => a.course.localeCompare(b.course));
      default:
        return sorted;
    }
  }, [expenses, sortOrder]);
  
  // Handle sort button click - cycle through sort options
  const handleSortClick = () => {
    const sortOptions = ['date-desc', 'date-asc', 'amount-desc', 'amount-asc', 'category', 'course'];
    const currentIndex = sortOptions.indexOf(sortOrder);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    setSortOrder(sortOptions[nextIndex]);
  };
  
  // Get sort display name
  const getSortDisplayName = () => {
    switch(sortOrder) {
      case 'date-desc': return 'Date ↓';
      case 'date-asc': return 'Date ↑';
      case 'amount-desc': return 'Amount ↓';
      case 'amount-asc': return 'Amount ↑';
      case 'category': return 'Category';
      case 'course': return 'Course';
      default: return 'Sort';
    }
  };
  
  // Handle adding a new expense
  const handleAddExpense = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add expenses",
        variant: "destructive"
      });
      return;
    }

    if (!newExpense.description.trim() || newExpense.amount <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const expenseToAdd = {
        description: newExpense.description.trim(),
        amount: newExpense.amount,
        category: newExpense.category.trim() || 'Supplies',
        course: newExpense.course.trim() || 'General',
        receipt: newExpense.receipt,
        date: newExpense.date,
        user_id: user.id
      };
      
      console.log("Inserting new expense:", expenseToAdd);
      
      const { data, error } = await supabase
        .from('expenses')
        .insert(expenseToAdd)
        .select();
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Successfully inserted expense:", data);
      
      toast({
        title: "Success",
        description: "Expense added successfully"
      });
      
      // Reset form and close dialog
      setNewExpense({
        description: '',
        amount: 0,
        category: 'Supplies',
        course: 'General',
        receipt: false,
        date: new Date().toISOString().split('T')[0]
      });
      setIsAddDialogOpen(false);
      triggerRefresh('expenses');
      
      // Force a page refresh event for real-time update
      window.dispatchEvent(new CustomEvent('refreshData', { detail: { table: 'expenses' } }));
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add expense",
        variant: "destructive"
      });
    }
  };
  
  // Handle updating an expense
  const handleUpdateExpense = async () => {
    if (!user || !selectedExpense) return;
    
    try {
      const { error } = await supabase
        .from('expenses')
        .update(newExpense as any)
        .eq('id', selectedExpense.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Expense updated successfully"
      });
      
      setIsEditDialogOpen(false);
      setSelectedExpense(null);
      triggerRefresh('expenses');
    } catch (error) {
      console.error("Error updating expense:", error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive"
      });
    }
  };
  
  // Handle receipt upload (mock function)
  const handleUploadReceipt = async () => {
    if (!selectedExpense) return;
    
    try {
      // In a real app, this would handle file upload
      // For now, we'll just update the receipt flag
      const { error } = await supabase
        .from('expenses')
        .update({ receipt: true })
        .eq('id', selectedExpense.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Receipt uploaded successfully"
      });
      
      setIsUploadDialogOpen(false);
      setSelectedExpense(null);
      triggerRefresh('expenses');
    } catch (error) {
      console.error("Error uploading receipt:", error);
      toast({
        title: "Error",
        description: "Failed to upload receipt",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Expense Tracker ({expenses.length} items)</CardTitle>
          <div className="flex flex-wrap gap-2">
            {onRefetch && <ExpenseCsvManager expenses={expenses} onRefetch={onRefetch} />}
            {selectedExpenses.length > 0 && onBulkDelete && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleBulkDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedExpenses.length})
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleSortClick}
            >
              <ArrowUpDown className="h-3 w-3" />
              <span>{getSortDisplayName()}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-12">
            <p>Loading expense data...</p>
          </div>
        ) : sortedExpenses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                {onBulkDelete && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExpenses.map(expense => {
                const isSelected = selectedExpenses.includes(expense.id);
                return (
                  <TableRow key={expense.id} className={isSelected ? "bg-muted/50" : ""}>
                    {onBulkDelete && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectExpense(expense.id, checked as boolean)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      {new Date(expense.date).toLocaleDateString()}
                    </TableCell>
                  <TableCell>
                    <div className="font-medium">{expense.description}</div>
                  </TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{expense.course}</TableCell>
                  <TableCell>${expense.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    {expense.receipt ? (
                      <CheckCircle className="h-4 w-4 text-secondary" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Missing</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedExpense(expense);
                          setIsDetailDialogOpen(true);
                        }}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedExpense(expense);
                          setNewExpense({
                            description: expense.description,
                            amount: expense.amount,
                            category: expense.category,
                            course: expense.course,
                            receipt: !!expense.receipt,
                            date: new Date(expense.date).toISOString().split('T')[0]
                          });
                          setIsEditDialogOpen(true);
                        }}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedExpense(expense);
                          setIsUploadDialogOpen(true);
                        }}>
                          Upload Receipt
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => onDeleteExpense(expense.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium mb-1">No expenses found</h3>
            <p className="text-muted-foreground">Try adjusting your search or add a new expense</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Add New Expense</span>
        </Button>
      </CardFooter>
      
      {/* Add Expense Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Add a new expense to your tracker
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                placeholder="Enter expense description..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input 
                  id="category" 
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  placeholder="Supplies"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="course">Course</Label>
                <Input 
                  id="course" 
                  value={newExpense.course}
                  onChange={(e) => setNewExpense({...newExpense, course: e.target.value})}
                  placeholder="General"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddExpense} 
              disabled={!newExpense.description || newExpense.amount <= 0}
            >
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Expense Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          
          {selectedExpense && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p>{selectedExpense.description}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p>${selectedExpense.amount.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p>{selectedExpense.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Course</p>
                  <p>{selectedExpense.course}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p>{new Date(selectedExpense.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receipt</p>
                  <p>{selectedExpense.receipt ? "Available" : "Not available"}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Expense Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update expense details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input 
                id="edit-description" 
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Amount ($)</Label>
                <Input 
                  id="edit-amount" 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input 
                  id="edit-date" 
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input 
                  id="edit-category" 
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-course">Course</Label>
                <Input 
                  id="edit-course" 
                  value={newExpense.course}
                  onChange={(e) => setNewExpense({...newExpense, course: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateExpense}
              disabled={!newExpense.description || newExpense.amount <= 0}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Upload Receipt Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Receipt</DialogTitle>
            <DialogDescription>
              Attach a receipt to this expense
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="receipt">Receipt File</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground">Drag & drop a file here, or click to select</p>
                <Input 
                  id="receipt" 
                  type="file" 
                  className="hidden" 
                  accept="image/*,.pdf"
                  onChange={() => {}}
                />
                <Button variant="outline" className="mt-2" onClick={() => {}}>
                  Select File
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Accept images and PDF files up to 5MB
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadReceipt}>
              Upload Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

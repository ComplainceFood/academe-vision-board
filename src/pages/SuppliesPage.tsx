
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Plus, 
  Filter, 
  ShoppingBag, 
  AlertTriangle, 
  CheckCircle,
  ArrowUpDown,
  FileText,
  PackageOpen,
  MoreVertical,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SupplyItem {
  id: string;
  name: string;
  category: string;
  currentCount: number;
  totalCount: number;
  threshold: number;
  course: string;
  lastRestocked?: string;
  cost?: number;
}

interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  course: string;
  receipt?: boolean;
}

const SuppliesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("inventory");
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<SupplyItem | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [updatedCount, setUpdatedCount] = useState<number>(0);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch data from Supabase instead of using mock data
  const fetchData = async () => {
    setIsLoading(true);
    
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    // Fetch supplies
    const { data: suppliesData, error: suppliesError } = await supabase
      .from('supplies')
      .select('*')
      .eq('user_id', user.id);
    
    if (suppliesError) {
      console.error('Error fetching supplies:', suppliesError);
      toast({
        title: "Error",
        description: "Failed to fetch supplies data",
        variant: "destructive",
      });
    } else {
      // Transform Supabase data to match our interface
      const transformedSupplies = suppliesData.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        currentCount: item.current_count,
        totalCount: item.total_count,
        threshold: item.threshold,
        course: item.course,
        lastRestocked: item.last_restocked,
        cost: item.cost
      }));
      
      setSupplies(transformedSupplies);
    }
    
    // Fetch expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id);
    
    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
      toast({
        title: "Error",
        description: "Failed to fetch expenses data",
        variant: "destructive",
      });
    } else {
      // Transform Supabase data to match our interface
      const transformedExpenses = expensesData.map(item => ({
        id: item.id,
        date: item.date,
        description: item.description,
        amount: item.amount,
        category: item.category,
        course: item.course,
        receipt: item.receipt
      }));
      
      setExpenses(transformedExpenses);
    }
    
    setIsLoading(false);
  };
  
  // Load data on component mount
  useState(() => {
    fetchData();
  }, [user]);
  
  // Handle supply actions
  const handleDeleteSupply = async () => {
    if (!itemToDelete) return;
    
    const { error } = await supabase
      .from('supplies')
      .delete()
      .eq('id', itemToDelete);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      
      // Update local state
      setSupplies(supplies.filter(item => item.id !== itemToDelete));
    }
    
    setItemToDelete(null);
  };
  
  const handleUpdateStock = async () => {
    if (!editingItem || updatedCount === 0) {
      setEditingItem(null);
      return;
    }
    
    const { error } = await supabase
      .from('supplies')
      .update({ current_count: updatedCount, last_restocked: new Date().toISOString() })
      .eq('id', editingItem.id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Stock updated successfully",
      });
      
      // Update local state
      setSupplies(supplies.map(item => 
        item.id === editingItem.id ? 
        { ...item, currentCount: updatedCount, lastRestocked: new Date().toISOString() } : 
        item
      ));
    }
    
    setEditingItem(null);
    setUpdatedCount(0);
  };
  
  const handleAddToShoppingList = (item: SupplyItem) => {
    // This would typically add to a shopping list table or state
    toast({
      title: "Added to Shopping List",
      description: `${item.name} has been added to your shopping list`,
    });
  };
  
  // Handle expense actions
  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseToDelete);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
      
      // Update local state
      setExpenses(expenses.filter(expense => expense.id !== expenseToDelete));
    }
    
    setExpenseToDelete(null);
  };
  
  // Filter supplies based on search query
  const filteredSupplies = supplies.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.course.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter expenses based on search query
  const filteredExpenses = expenses.filter(expense => 
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.course.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate warning items
  const warningItems = supplies.filter(item => item.currentCount <= item.threshold);
  
  // Sort supplies by current/total ratio (ascending)
  const sortedSupplies = [...filteredSupplies].sort((a, b) => 
    (a.currentCount / a.totalCount) - (b.currentCount / b.totalCount)
  );
  
  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Supplies & Expenses</h1>
            <p className="text-muted-foreground">Track your classroom supplies and expenses</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Shopping List</span>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="glassmorphism">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{warningItems.length}</div>
                  <p className="text-sm text-muted-foreground">Items below threshold</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glassmorphism">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-secondary/10 text-secondary">
                  <PackageOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{supplies.length}</div>
                  <p className="text-sm text-muted-foreground">Different items tracked</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glassmorphism">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-accent/10 text-accent">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-3xl font-bold">${totalExpenses.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">Semester to date</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search items..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              <span>Filter</span>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="inventory" onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory" className="flex items-center gap-1">
              <PackageOpen className="h-4 w-4" />
              <span>Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Expenses</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="mt-4">
            <Card>
              <CardHeader className="pb-0">
                <div className="flex justify-between items-center">
                  <CardTitle>Supply Inventory</CardTitle>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <ArrowUpDown className="h-3 w-3" />
                    <span>Sort</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <p>Loading inventory data...</p>
                  </div>
                ) : sortedSupplies.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedSupplies.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium">{item.name}</div>
                          </TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.course}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={item.currentCount <= item.threshold ? "text-destructive font-bold" : ""}>
                                {item.currentCount}/{item.totalCount}
                              </span>
                              <Progress 
                                value={(item.currentCount / item.totalCount) * 100} 
                                className="w-20 h-2"
                                aria-label="Stock level"
                              />
                              {item.currentCount <= item.threshold && (
                                <Badge variant="destructive" className="text-xs">Low</Badge>
                              )}
                            </div>
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
                                  setEditingItem(item);
                                  setUpdatedCount(item.currentCount);
                                }}>
                                  Update Stock
                                </DropdownMenuItem>
                                <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAddToShoppingList(item)}>
                                  Add to Shopping List
                                </DropdownMenuItem>
                                <DropdownMenuItem>View History</DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => setItemToDelete(item.id)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium mb-1">No items found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or add new items</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Add New Item</span>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="expenses" className="mt-4">
            <Card>
              <CardHeader className="pb-0">
                <div className="flex justify-between items-center">
                  <CardTitle>Expense Tracker</CardTitle>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <ArrowUpDown className="h-3 w-3" />
                    <span>Sort</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <p>Loading expense data...</p>
                  </div>
                ) : filteredExpenses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                      {filteredExpenses.map(expense => (
                        <TableRow key={expense.id}>
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
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Upload Receipt</DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => setExpenseToDelete(expense.id)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
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
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Add New Expense</span>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Confirmation dialogs and popovers */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this item from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupply} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this expense record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Popover open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Update Stock</h4>
              <p className="text-sm text-muted-foreground">
                Update the current stock level for {editingItem?.name}
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <label htmlFor="current">Current Count:</label>
                <Input
                  id="current"
                  type="number"
                  className="col-span-2"
                  value={updatedCount}
                  onChange={(e) => setUpdatedCount(Number(e.target.value))}
                  max={editingItem?.totalCount || 0}
                  min={0}
                />
              </div>
              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                <Button onClick={handleUpdateStock}>Save Changes</Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </MainLayout>
  );
};

export default SuppliesPage;

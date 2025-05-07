
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag } from "lucide-react";
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
import { useDataFetching } from "@/hooks/useDataFetching";
import { ShoppingListDialog } from "@/components/supplies/ShoppingListDialog";
import { AddToShoppingListDialog } from "@/components/supplies/AddToShoppingListDialog";
import { useRefreshContext } from "@/App";
import { SuppliesStats } from "@/components/supplies/SuppliesStats";
import { SearchAndFilter } from "@/components/supplies/SearchAndFilter";
import { InventoryList } from "@/components/supplies/InventoryList";
import { ExpenseList } from "@/components/supplies/ExpenseList";
import { Input } from "@/components/ui/input";
import { AddItemDialog } from "@/components/supplies/AddItemDialog";
import { EditItemDialog } from "@/components/supplies/EditItemDialog";
import { ItemHistoryDialog } from "@/components/supplies/ItemHistoryDialog";

interface SupplyItem {
  id: string;
  name: string;
  category: string;
  current_count: number;
  total_count: number;
  threshold: number;
  course: string;
  last_restocked?: string;
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
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<SupplyItem | null>(null);
  const [updatedCount, setUpdatedCount] = useState<number>(0);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [itemToAddToList, setItemToAddToList] = useState<SupplyItem | null>(null);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<SupplyItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [itemForHistory, setItemForHistory] = useState<SupplyItem | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>('stock-asc');
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { triggerRefresh } = useRefreshContext();
  
  // Use the useDataFetching hook for data fetching
  const { 
    data: supplies, 
    isLoading: isLoadingSupplies, 
    error: suppliesError,
    refetch: refetchSupplies 
  } = useDataFetching<SupplyItem>({ table: 'supplies' });
  
  const { 
    data: expenses, 
    isLoading: isLoadingExpenses, 
    error: expensesError,
    refetch: refetchExpenses
  } = useDataFetching<Expense>({ table: 'expenses' });
  
  const { 
    data: shoppingItems, 
    isLoading: isLoadingShoppingItems,
    refetch: refetchShoppingItems 
  } = useDataFetching<any>({ 
    table: 'shopping_list',
    enabled: !!user
  });
  
  const shoppingListCount = shoppingItems.filter((item: any) => !item.purchased).length;
  
  // Handlers
  const handleDeleteSupply = async () => {
    if (!itemToDelete) return;
    
    try {
      const { error } = await supabase
        .from('supplies')
        .delete()
        .eq('id', itemToDelete);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      
      triggerRefresh('supplies');
      refetchSupplies();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setItemToDelete(null);
    }
  };
  
  const handleUpdateStock = async () => {
    if (!editingItem || updatedCount === editingItem.current_count) {
      setEditingItem(null);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('supplies')
        .update({ 
          current_count: updatedCount, 
          last_restocked: new Date().toISOString() 
        })
        .eq('id', editingItem.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Stock updated successfully",
      });
      
      triggerRefresh('supplies');
      refetchSupplies();
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      });
    } finally {
      setEditingItem(null);
      setUpdatedCount(0);
    }
  };
  
  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseToDelete);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
      
      triggerRefresh('expenses');
      refetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    } finally {
      setExpenseToDelete(null);
    }
  };

  const handleEditItem = (item: SupplyItem) => {
    setItemToEdit(item);
    setIsEditDialogOpen(true);
  };

  const handleViewHistory = (item: SupplyItem) => {
    setItemForHistory(item);
    setIsHistoryDialogOpen(true);
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
  const warningItems = supplies.filter(item => item.current_count <= item.threshold);
  
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
            <Button 
              className="flex items-center gap-2"
              onClick={() => setIsAddItemDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setIsShoppingListOpen(true)}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>
                Shopping List
                {shoppingListCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{shoppingListCount}</Badge>
                )}
              </span>
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <SuppliesStats 
          warningItems={warningItems.length}
          totalSupplies={supplies.length}
          totalExpenses={totalExpenses}
        />
        
        {/* Search and Filter */}
        <SearchAndFilter 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        {/* Tab Navigation */}
        <Tabs defaultValue="inventory" onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory" className="flex items-center gap-1">
              <ShoppingBag className="h-4 w-4" />
              <span>Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-1">
              <ShoppingBag className="h-4 w-4" />
              <span>Expenses</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="mt-4">
            <InventoryList 
              supplies={filteredSupplies}
              isLoading={isLoadingSupplies}
              onUpdateStock={item => {
                setEditingItem(item);
                setUpdatedCount(item.current_count);
              }}
              onDeleteItem={id => setItemToDelete(id)}
              onAddToShoppingList={item => setItemToAddToList(item)}
              onAddItemClick={() => setIsAddItemDialogOpen(true)}
              onEditItem={handleEditItem}
              onViewHistory={handleViewHistory}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
            />
          </TabsContent>
          
          <TabsContent value="expenses" className="mt-4">
            <ExpenseList 
              expenses={filteredExpenses}
              isLoading={isLoadingExpenses}
              onDeleteExpense={id => setExpenseToDelete(id)}
            />
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
                  max={editingItem?.total_count || 0}
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
      
      {/* Shopping list dialog */}
      <ShoppingListDialog 
        open={isShoppingListOpen} 
        onOpenChange={setIsShoppingListOpen} 
      />
      
      {/* Add to shopping list dialog */}
      <AddToShoppingListDialog 
        open={!!itemToAddToList} 
        onOpenChange={(open) => {
          if (!open) {
            setItemToAddToList(null);
            // Auto-refresh shopping list after adding an item
            refetchShoppingItems();
          }
        }} 
        item={itemToAddToList}
      />

      {/* Add item dialog */}
      <AddItemDialog 
        open={isAddItemDialogOpen} 
        onOpenChange={setIsAddItemDialogOpen}
      />

      {/* Edit item dialog */}
      <EditItemDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        item={itemToEdit}
      />

      {/* View item history dialog */}
      <ItemHistoryDialog
        open={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
        item={itemForHistory}
      />
    </MainLayout>
  );
};

export default SuppliesPage;

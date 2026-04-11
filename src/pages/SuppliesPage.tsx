import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
import { SupplyItem } from "@/types/shoppingList";
import { InventoryCsvManager } from "@/components/supplies/InventoryCsvManager";
import { SuppliesAIAnalysis } from "@/components/supplies/SuppliesAIAnalysis";
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
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkDeleteItems, setBulkDeleteItems] = useState<string[]>([]);
  const [bulkShoppingListItems, setBulkShoppingListItems] = useState<SupplyItem[]>([]);
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const {
    triggerRefresh
  } = useRefreshContext();

  // Use the useDataFetching hook for data fetching
  const {
    data: supplies,
    isLoading: isLoadingSupplies,
    error: suppliesError,
    refetch: refetchSupplies
  } = useDataFetching<SupplyItem>({
    table: 'supplies'
  });
  const {
    data: expenses,
    isLoading: isLoadingExpenses,
    error: expensesError,
    refetch: refetchExpenses
  } = useDataFetching<Expense>({
    table: 'expenses'
  });
  const {
    data: shoppingItems,
    isLoading: isLoadingShoppingItems,
    refetch: refetchShoppingItems
  } = useDataFetching<any>({
    table: 'shopping_list',
    enabled: !!user
  });

  // Auto-refresh data on component mount and after actions
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!isProcessing) {
        refetchSupplies();
        refetchExpenses();
        refetchShoppingItems();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [refetchSupplies, refetchExpenses, refetchShoppingItems, isProcessing]);
  const shoppingListCount = shoppingItems.filter((item: any) => !item.purchased).length;

  // Handlers
  const handleDeleteSupply = async () => {
    if (!itemToDelete || isProcessing) return;
    try {
      setIsProcessing(true);
      const { error } = await supabase.from('supplies').delete().eq('id', itemToDelete);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Item deleted successfully"
      });
      triggerRefresh('supplies');
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    } finally {
      setItemToDelete(null);
      setIsProcessing(false);
      refetchSupplies();
    }
  };

  const handleBulkDeleteSupplies = async (itemIds: string[]) => {
    if (itemIds.length === 0 || isProcessing) return;
    setBulkDeleteItems(itemIds);
  };

  const confirmBulkDelete = async () => {
    if (bulkDeleteItems.length === 0 || isProcessing) return;
    try {
      setIsProcessing(true);
      const { error } = await supabase.
      from('supplies').
      delete().
      in('id', bulkDeleteItems);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${bulkDeleteItems.length} items deleted successfully`
      });
      triggerRefresh('supplies');
    } catch (error) {
      console.error("Error deleting items:", error);
      toast({
        title: "Error",
        description: "Failed to delete items",
        variant: "destructive"
      });
    } finally {
      setBulkDeleteItems([]);
      setIsProcessing(false);
      refetchSupplies();
    }
  };

  const handleBulkDeleteExpenses = async (expenseIds: string[]) => {
    if (expenseIds.length === 0 || isProcessing) return;
    try {
      setIsProcessing(true);
      const { error } = await supabase.
      from('expenses').
      delete().
      in('id', expenseIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${expenseIds.length} expenses deleted successfully`
      });
      triggerRefresh('expenses');
    } catch (error) {
      console.error("Error deleting expenses:", error);
      toast({
        title: "Error",
        description: "Failed to delete expenses",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      refetchExpenses();
    }
  };
  const handleUpdateStock = async () => {
    if (!editingItem || isProcessing) {
      setEditingItem(null);
      return;
    }
    try {
      setIsProcessing(true);

      if (!editingItem) throw new Error('No item selected');

      // Validate and clamp the value
      let nextCount = Number.isFinite(updatedCount) ? Math.round(updatedCount) : NaN;
      if (Number.isNaN(nextCount)) {
        toast({ title: 'Invalid value', description: 'Please enter a valid number', variant: 'destructive' });
        return;
      }
      if (nextCount < 0) nextCount = 0;
      if (typeof editingItem.total_count === 'number') {
        nextCount = Math.min(nextCount, editingItem.total_count);
      }

      console.log('Updating stock for', editingItem.id, 'to', nextCount);

      const { error } = await supabase.
      from('supplies').
      update({
        current_count: nextCount,
        last_restocked: new Date().toISOString()
      }).
      eq('id', editingItem.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Stock updated successfully' });
      triggerRefresh('supplies');
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({ title: 'Error', description: 'Failed to update stock', variant: 'destructive' });
    } finally {
      setEditingItem(null);
      setUpdatedCount(0);
      setIsProcessing(false);
      refetchSupplies(); // Refetch after operation completes
    }
  };
  const handleDeleteExpense = async () => {
    if (!expenseToDelete || isProcessing) return;
    try {
      setIsProcessing(true);
      const {
        error
      } = await supabase.from('expenses').delete().eq('id', expenseToDelete);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Expense deleted successfully"
      });
      triggerRefresh('expenses');
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive"
      });
    } finally {
      setExpenseToDelete(null);
      setIsProcessing(false);
      refetchExpenses();
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

  // Filter supplies based on search query and low stock filter
  const filteredSupplies = supplies.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLowStock = showLowStockOnly ? item.current_count <= item.threshold : true;
    return matchesSearch && matchesLowStock;
  });

  // Filter expenses based on search query
  const filteredExpenses = expenses.filter((expense) => expense.description.toLowerCase().includes(searchQuery.toLowerCase()) || expense.category.toLowerCase().includes(searchQuery.toLowerCase()) || expense.course.toLowerCase().includes(searchQuery.toLowerCase()));

  // Calculate warning items (low stock)
  const warningItems = supplies.filter((item) => item.current_count <= item.threshold);

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Handle bulk add to shopping list
  const handleBulkAddToShoppingList = (items: SupplyItem[]) => {
    setBulkShoppingListItems(items);
  };

  const confirmBulkAddToShoppingList = async () => {
    if (bulkShoppingListItems.length === 0 || !user || isProcessing) return;

    try {
      setIsProcessing(true);
      const itemsToInsert = bulkShoppingListItems.map((item) => ({
        name: item.name,
        quantity: Math.max(1, item.threshold - item.current_count + 5),
        priority: item.current_count <= item.threshold ? "high" : "medium",
        notes: `Auto-added from inventory - ${item.category}`,
        purchased: false,
        user_id: user.id,
        supply_id: item.id
      }));

      const { error } = await supabase.
      from('shopping_list').
      insert(itemsToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${bulkShoppingListItems.length} items to shopping list`
      });
      triggerRefresh('shopping_list');
      refetchShoppingItems();
    } catch (error) {
      console.error("Error adding to shopping list:", error);
      toast({
        title: "Error",
        description: "Failed to add items to shopping list",
        variant: "destructive"
      });
    } finally {
      setBulkShoppingListItems([]);
      setIsProcessing(false);
    }
  };

  // Handle tab change to trigger data refresh
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (newTab === 'inventory' && !isProcessing) {
      refetchSupplies();
    } else if (newTab === 'expenses' && !isProcessing) {
      refetchExpenses();
    }
  };
  return <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-secondary/20 rounded-full blur-3xl animate-pulse" />
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 shadow-xl">
                    <ShoppingBag className="h-10 w-10" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight">Supplies & Expenses</h1>
                    <p className="text-primary-foreground/80 text-lg mt-1">Track your inventory and lab expenses</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <InventoryCsvManager supplies={supplies} onRefetch={refetchSupplies} />
                <Button
                onClick={() => setIsAddItemDialogOpen(true)}
                disabled={isProcessing}
                size="lg"
                className="bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground border border-primary-foreground/20 backdrop-blur-sm shadow-lg transition-all hover:scale-105">

                  <Plus className="h-5 w-5 mr-2" />
                  Add Item
                </Button>
                <Button
                variant="outline"
                onClick={() => setIsShoppingListOpen(true)}
                disabled={isProcessing}
                size="lg"
                className="bg-background text-primary hover:bg-background/90 shadow-lg transition-all hover:scale-105">

                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Shopping List
                  {shoppingListCount > 0 && <Badge variant="secondary" className="ml-2">{shoppingListCount}</Badge>}
                </Button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-primary-foreground/20">
                <p className="text-xs uppercase tracking-wider text-primary-foreground">Total Items</p>
                <p className="text-3xl font-bold text-primary-foreground">{supplies.length}</p>
              </div>
              <div className="backdrop-blur-sm rounded-xl px-4 py-3 border border-primary-foreground/20 bg-destructive">
                <p className="text-primary-foreground/70 text-xs uppercase tracking-wider">Low Stock</p>
                <p className="text-3xl font-bold text-primary-foreground">{warningItems.length}</p>
              </div>
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-primary-foreground/20">
                <p className="text-xs uppercase tracking-wider text-primary-foreground">Total Expenses</p>
                <p className="text-3xl font-bold text-primary-foreground">${totalExpenses.toLocaleString()}</p>
              </div>
              <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-primary-foreground/20">
                <p className="text-xs uppercase tracking-wider text-primary-foreground">Shopping List</p>
                <p className="text-3xl font-bold text-primary-foreground">{shoppingListCount}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search and Filter */}
        <SearchAndFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showLowStockOnly={showLowStockOnly}
        setShowLowStockOnly={setShowLowStockOnly}
        lowStockCount={warningItems.length} />

        
        {/* Tab Navigation */}
        <Tabs defaultValue="inventory" onValueChange={handleTabChange}>
          <TabsList className="p-1.5 bg-muted/70 backdrop-blur-sm rounded-xl grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="inventory" className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <ShoppingBag className="h-4 w-4" />
              <span>Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <ShoppingBag className="h-4 w-4" />
              <span>Expenses</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <Sparkles className="h-4 w-4" />
              <span>AI Analysis</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="mt-4">
            <InventoryList
            supplies={filteredSupplies}
            isLoading={isLoadingSupplies}
            onUpdateStock={(item) => {
              setEditingItem(item);
              setUpdatedCount(item.current_count);
            }}
            onDeleteItem={(id) => setItemToDelete(id)}
            onBulkDelete={handleBulkDeleteSupplies}
            onAddToShoppingList={(item) => setItemToAddToList(item)}
            onBulkAddToShoppingList={handleBulkAddToShoppingList}
            onAddItemClick={() => setIsAddItemDialogOpen(true)}
            onEditItem={handleEditItem}
            onViewHistory={handleViewHistory}
            sortOrder={sortOrder}
            onSortChange={setSortOrder} />

          </TabsContent>
          
          <TabsContent value="expenses" className="mt-4">
            <ExpenseList
            expenses={filteredExpenses}
            isLoading={isLoadingExpenses}
            onDeleteExpense={(id) => setExpenseToDelete(id)}
            onBulkDelete={handleBulkDeleteExpenses}
            onRefetch={refetchExpenses} />
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <SuppliesAIAnalysis />
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
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupply} className="bg-destructive text-destructive-foreground" disabled={isProcessing}>
              {isProcessing ? 'Deleting...' : 'Delete'}
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
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive text-destructive-foreground" disabled={isProcessing}>
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={bulkDeleteItems.length > 0} onOpenChange={(open) => !open && setBulkDeleteItems([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Items</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {bulkDeleteItems.length} selected items? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground" disabled={isProcessing}>
              {isProcessing ? 'Deleting...' : `Delete ${bulkDeleteItems.length} Items`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk add to shopping list confirmation dialog */}
      <AlertDialog open={bulkShoppingListItems.length > 0} onOpenChange={(open) => !open && setBulkShoppingListItems([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Items to Shopping List</AlertDialogTitle>
            <AlertDialogDescription>
              Add {bulkShoppingListItems.length} selected items to your shopping list? Quantities will be calculated based on threshold levels.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkAddToShoppingList} disabled={isProcessing}>
              {isProcessing ? 'Adding...' : `Add ${bulkShoppingListItems.length} Items`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
            <DialogDescription>
              Update the current stock level for {editingItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
              <label htmlFor="current">Current Count:</label>
              <Input
              id="current"
              type="number"
              inputMode="numeric"
              className="col-span-2"
              value={Number.isFinite(updatedCount) ? updatedCount : 0}
              onChange={(e) => setUpdatedCount(Number(e.target.value))}
              max={editingItem?.total_count ?? undefined}
              min={0}
              disabled={isProcessing} />

            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStock} disabled={isProcessing || Number.isNaN(updatedCount)}>
              {isProcessing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Shopping list dialog */}
      <ShoppingListDialog open={isShoppingListOpen} onOpenChange={setIsShoppingListOpen} />
      
      {/* Add to shopping list dialog */}
      <AddToShoppingListDialog open={!!itemToAddToList} onOpenChange={(open) => {
      if (!open) {
        setItemToAddToList(null);
        // Auto-refresh shopping list after adding an item
        refetchShoppingItems();
        triggerRefresh('shopping_list');
      }
    }} item={itemToAddToList} />

      {/* Add item dialog */}
      <AddItemDialog open={isAddItemDialogOpen} onOpenChange={(state) => {
      setIsAddItemDialogOpen(state);
      if (!state) {
        // Refresh data when dialog closes
        refetchSupplies();
      }
    }} />

      {/* Edit item dialog */}
      <EditItemDialog open={isEditDialogOpen} onOpenChange={(state) => {
      setIsEditDialogOpen(state);
      if (!state) {
        setItemToEdit(null);
        refetchSupplies();
      }
    }} item={itemToEdit} />

      {/* View item history dialog */}
      <ItemHistoryDialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen} item={itemForHistory} />
    </MainLayout>;
};
export default SuppliesPage;
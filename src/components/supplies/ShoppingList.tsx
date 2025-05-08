
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Plus, Save } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingItem } from "@/types/shoppingList";
import { ShoppingListItem } from "./ShoppingListItem";
import { ItemDetailDialog } from "./ItemDetailDialog";
import { EditItemDialog } from "./EditItemDialog";
import { useRefreshContext } from "@/App";

// This interface is for the shopping list's internal usage, not for the inventory
interface ShoppingEditItem extends Partial<ShoppingItem> {
  name?: string;
  quantity?: number;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  purchased?: boolean;
}

export const ShoppingList = () => {
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { triggerRefresh } = useRefreshContext();

  // Fetch shopping list items
  const fetchShoppingItems = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopping_list')
        .select('*')
        .eq('user_id', user.id) as { data: ShoppingItem[] | null, error: any };
      
      if (error) throw error;
      
      setShoppingItems(data || []);
    } catch (error) {
      console.error("Error fetching shopping list:", error);
      toast({
        title: "Error",
        description: "Failed to fetch shopping list",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchShoppingItems();
    }
  }, [user]);

  // Filter and sort shopping items
  const sortedItems = React.useMemo(() => {
    return [...shoppingItems].sort((a, b) => {
      // Sort by purchased status (unpurchased first)
      if (a.purchased !== b.purchased) {
        return a.purchased ? 1 : -1;
      }
      
      // Then sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority as 'high' | 'medium' | 'low'] - priorityOrder[b.priority as 'high' | 'medium' | 'low'];
    });
  }, [shoppingItems]);

  const handleAddItem = async () => {
    if (!user || !newItemName.trim()) return;
    
    try {
      const newItem = {
        name: newItemName.trim(),
        quantity: newItemQuantity,
        purchased: false,
        priority: 'medium' as const,
        user_id: user.id,
      };
      
      const { error } = await supabase
        .from('shopping_list')
        .insert(newItem as any);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Item added to shopping list",
      });
      
      // Clear form and refresh data
      setNewItemName("");
      setNewItemQuantity(1);
      setIsAddDialogOpen(false);
      fetchShoppingItems();
      triggerRefresh('shopping_list');
      
    } catch (error) {
      console.error("Error adding shopping list item:", error);
      toast({
        title: "Error",
        description: "Failed to add item to shopping list",
        variant: "destructive",
      });
    }
  };

  const handleTogglePurchased = async (id: string, purchased: boolean) => {
    try {
      const { error } = await supabase
        .from('shopping_list')
        .update({ purchased: !purchased } as any)
        .eq('id', id);
      
      if (error) throw error;
      
      fetchShoppingItems();
      triggerRefresh('shopping_list');
    } catch (error) {
      console.error("Error updating shopping list item:", error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shopping_list')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Item removed from shopping list",
      });
      
      fetchShoppingItems();
      triggerRefresh('shopping_list');
    } catch (error) {
      console.error("Error deleting shopping list item:", error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const handleEditItem = () => {
    if (!selectedItem) return;
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (editedItem: ShoppingEditItem) => {
    if (!selectedItem) return;
    
    try {
      const { error } = await supabase
        .from('shopping_list')
        .update({
          name: editedItem.name,
          quantity: editedItem.quantity,
          priority: editedItem.priority,
          notes: editedItem.notes
        } as any)
        .eq('id', selectedItem.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      fetchShoppingItems();
      triggerRefresh('shopping_list');
    } catch (error) {
      console.error("Error updating shopping list item:", error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };
  
  // Implement "Clear Purchased" functionality
  const handleClearPurchased = async () => {
    try {
      const purchasedIds = shoppingItems
        .filter(item => item.purchased)
        .map(item => item.id);
        
      if (purchasedIds.length === 0) return;
      
      const { error } = await supabase
        .from('shopping_list')
        .delete()
        .in('id', purchasedIds);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `${purchasedIds.length} purchased items cleared`,
      });
      
      fetchShoppingItems();
      triggerRefresh('shopping_list');
    } catch (error) {
      console.error("Error clearing purchased items:", error);
      toast({
        title: "Error",
        description: "Failed to clear purchased items",
        variant: "destructive",
      });
    }
  };

  // Implement "Save List" functionality
  const handleSaveList = async () => {
    try {
      // Here we would typically implement a more complex save functionality
      // For now, we just indicate to the user that the list is saved
      toast({
        title: "List Saved",
        description: "Your shopping list has been saved"
      });
      
      // In a real application, this might involve:
      // - Generating a PDF
      // - Sending an email
      // - Sharing to another device
      // - Exporting to other formats
    } catch (error) {
      console.error("Error saving list:", error);
      toast({
        title: "Error",
        description: "Failed to save list",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="animate-fade-in">
      <Card className="shadow-md glassmorphism">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Shopping List</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Add Item</span>
          </Button>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading shopping list...</p>
            </div>
          ) : shoppingItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium mb-1">Your shopping list is empty</h3>
              <p className="text-muted-foreground">Add items that you need to purchase</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedItems.map(item => (
                <ShoppingListItem 
                  key={item.id}
                  item={item}
                  onTogglePurchased={handleTogglePurchased}
                  onDelete={handleDeleteItem}
                  onItemClick={setSelectedItem}
                />
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            {shoppingItems.filter(item => !item.purchased).length} items remaining
          </div>
          <div className="flex gap-2">
            {shoppingItems.some(item => item.purchased) && (
              <Button variant="outline" size="sm" onClick={handleClearPurchased}>
                Clear Purchased
              </Button>
            )}
            <Button 
              size="sm" 
              className="flex items-center gap-1" 
              onClick={handleSaveList}
            >
              <Save className="h-4 w-4" />
              <span>Save List</span>
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Shopping List</DialogTitle>
            <DialogDescription>
              Add a new item to your shopping list
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="itemName">Item Name</Label>
              <Input 
                id="itemName" 
                placeholder="Enter item name..." 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input 
                id="quantity" 
                type="number" 
                min="1"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(Number(e.target.value))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={!newItemName.trim()}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Detail Dialog */}
      <ItemDetailDialog 
        item={selectedItem}
        open={!!selectedItem && !isEditDialogOpen}
        onOpenChange={(open) => !open && setSelectedItem(null)}
        onEdit={handleEditItem}
      />

      {/* Edit Item Dialog */}
      <EditItemDialog 
        item={selectedItem}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

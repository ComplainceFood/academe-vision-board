
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDataFetching } from "@/hooks/useDataFetching";
import { ShoppingBag, Plus, Trash2, Check, X, FileText, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  purchased: boolean;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  user_id: string;
  supply_id?: string;
}

export const ShoppingList = () => {
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedItem, setEditedItem] = useState<Partial<ShoppingItem>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  // Use the useDataFetching hook to fetch shopping list items
  const { 
    data: shoppingItems, 
    isLoading, 
    error,
    refetch 
  } = useDataFetching<ShoppingItem>({ 
    table: 'shopping_list',
    enabled: !!user
  });

  // Filter and sort shopping items
  const sortedItems = [...shoppingItems].sort((a, b) => {
    // Sort by purchased status (unpurchased first)
    if (a.purchased !== b.purchased) {
      return a.purchased ? 1 : -1;
    }
    
    // Then sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

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
      
      const { error } = await supabase.from('shopping_list').insert(newItem);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Item added to shopping list",
      });
      
      // Clear form and refresh data
      setNewItemName("");
      setNewItemQuantity(1);
      setIsAddDialogOpen(false);
      refetch();
      
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
        .update({ purchased: !purchased })
        .eq('id', id);
      
      if (error) throw error;
      
      refetch();
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
      
      refetch();
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
    setEditedItem({...selectedItem});
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem || !editedItem) return;
    
    try {
      const { error } = await supabase
        .from('shopping_list')
        .update({
          name: editedItem.name,
          quantity: editedItem.quantity,
          priority: editedItem.priority,
          notes: editedItem.notes
        })
        .eq('id', selectedItem.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      refetch();
    } catch (error) {
      console.error("Error updating shopping list item:", error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive bg-destructive/10';
      case 'medium': return 'text-amber-500 bg-amber-500/10';
      case 'low': return 'text-green-500 bg-green-500/10';
      default: return 'text-muted-foreground bg-muted/10';
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
                <div 
                  key={item.id} 
                  className={`p-3 border rounded-lg flex items-center justify-between gap-4 ${
                    item.purchased ? 'bg-muted/30' : 'bg-card'
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox 
                      checked={item.purchased} 
                      onCheckedChange={() => handleTogglePurchased(item.id, item.purchased)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${item.purchased ? 'line-through text-muted-foreground' : ''}`}>
                          {item.name}
                        </p>
                        <div className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </div>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      x{item.quantity}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
              <Button variant="outline" size="sm">
                Clear Purchased
              </Button>
            )}
            <Button size="sm" className="flex items-center gap-1">
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

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update details for this shopping list item
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editName">Item Name</Label>
              <Input 
                id="editName" 
                value={editedItem.name || ''}
                onChange={(e) => setEditedItem({...editedItem, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editQuantity">Quantity</Label>
              <Input 
                id="editQuantity" 
                type="number" 
                min="1"
                value={editedItem.quantity || 1}
                onChange={(e) => setEditedItem({...editedItem, quantity: Number(e.target.value)})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editPriority">Priority</Label>
              <select 
                id="editPriority" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editedItem.priority || 'medium'}
                onChange={(e) => setEditedItem({
                  ...editedItem, 
                  priority: e.target.value as 'low' | 'medium' | 'high'
                })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editNotes">Notes (optional)</Label>
              <Input 
                id="editNotes" 
                value={editedItem.notes || ''}
                onChange={(e) => setEditedItem({...editedItem, notes: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Details Dialog */}
      <Dialog open={!!selectedItem && !isEditDialogOpen} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quantity:</span>
              <span className="font-medium">{selectedItem?.quantity}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Priority:</span>
              <span className={`text-xs px-2 py-0.5 rounded ${selectedItem ? getPriorityColor(selectedItem.priority) : ''}`}>
                {selectedItem?.priority}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <span className={`text-xs px-2 py-0.5 rounded ${selectedItem?.purchased ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                {selectedItem?.purchased ? 'Purchased' : 'Needs to buy'}
              </span>
            </div>
            {selectedItem?.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                <p className="text-sm border rounded-md p-3 bg-muted/10">
                  {selectedItem.notes}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>
              Close
            </Button>
            <Button onClick={handleEditItem}>
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

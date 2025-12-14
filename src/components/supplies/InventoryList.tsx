import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, MoreVertical, PackageOpen, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SupplyItem } from "@/types/shoppingList";

interface InventoryListProps {
  supplies: SupplyItem[];
  isLoading: boolean;
  onUpdateStock: (item: SupplyItem) => void;
  onDeleteItem: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onAddToShoppingList: (item: SupplyItem) => void;
  onBulkAddToShoppingList: (items: SupplyItem[]) => void;
  onAddItemClick: () => void;
  onEditItem: (item: SupplyItem) => void;
  onViewHistory: (item: SupplyItem) => void;
  sortOrder: string;
  onSortChange: (sort: string) => void;
}

export const InventoryList = ({ 
  supplies,
  isLoading,
  onUpdateStock,
  onDeleteItem,
  onBulkDelete,
  onAddToShoppingList,
  onBulkAddToShoppingList,
  onAddItemClick,
  onEditItem,
  onViewHistory,
  sortOrder = 'stock-asc',
  onSortChange
}: InventoryListProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(supplies.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to delete",
        variant: "destructive"
      });
      return;
    }
    onBulkDelete(selectedItems);
    setSelectedItems([]);
  };

  const handleBulkAddToShoppingList = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to add to shopping list",
        variant: "destructive"
      });
      return;
    }
    const itemsToAdd = supplies.filter(item => selectedItems.includes(item.id));
    onBulkAddToShoppingList(itemsToAdd);
    setSelectedItems([]);
  };

  // Define sorting options
  const sortOptions = [
    { value: 'stock-asc', label: 'Stock Level (Low to High)' },
    { value: 'stock-desc', label: 'Stock Level (High to Low)' },
    { value: 'name-asc', label: 'Name (A to Z)' },
    { value: 'name-desc', label: 'Name (Z to A)' },
    { value: 'category-asc', label: 'Category' },
    { value: 'course-asc', label: 'Course' },
    { value: 'threshold-asc', label: 'Threshold' }
  ];

  const currentSortLabel = sortOptions.find(option => option.value === sortOrder)?.label || 'Sort';

  const handleSortChange = () => {
    const currentIndex = sortOptions.findIndex(option => option.value === sortOrder);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    onSortChange(sortOptions[nextIndex].value);
  };

  // Sort supplies based on the current sort order
  const sortedSupplies = React.useMemo(() => {
    const sorted = [...supplies];

    switch (sortOrder) {
      case 'stock-asc':
        return sorted.sort((a, b) => (a.current_count / a.total_count) - (b.current_count / b.total_count));
      case 'stock-desc':
        return sorted.sort((a, b) => (b.current_count / b.total_count) - (a.current_count / a.total_count));
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'category-asc':
        return sorted.sort((a, b) => a.category.localeCompare(b.category));
      case 'course-asc':
        return sorted.sort((a, b) => a.course.localeCompare(b.course));
      case 'threshold-asc':
        return sorted.sort((a, b) => (a.current_count - a.threshold) - (b.current_count - b.threshold));
      default:
        return sorted;
    }
  }, [supplies, sortOrder]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading inventory...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <PackageOpen className="h-5 w-5" />
            Inventory ({supplies.length} items)
          </CardTitle>
          <div className="flex gap-2">
            {selectedItems.length > 0 && (
              <>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleBulkAddToShoppingList}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Shopping List ({selectedItems.length})
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedItems.length})
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSortChange}
              className="flex items-center gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              {currentSortLabel}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedSupplies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <PackageOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No items found. Add your first inventory item!</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.length === supplies.length && supplies.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Last Restocked</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSupplies.map((item) => {
                const stockPercentage = (item.current_count / item.total_count) * 100;
                const isLowStock = item.current_count <= item.threshold;
                const isSelected = selectedItems.includes(item.id);

                return (
                  <TableRow key={item.id} className={isSelected ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.course}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="text-sm">
                            {item.current_count}/{item.total_count}
                          </div>
                          {isLowStock && (
                            <Badge variant="destructive" className="text-xs">
                              Low Stock
                            </Badge>
                          )}
                        </div>
                        <Progress 
                          value={stockPercentage} 
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.cost ? `$${item.cost.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      {item.last_restocked 
                        ? new Date(item.last_restocked).toLocaleDateString()
                        : "Never"
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onUpdateStock(item)}>
                            Update Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditItem(item)}>
                            Edit Item
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewHistory(item)}>
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAddToShoppingList(item)}>
                            Add to Shopping List
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteItem(item.id)}
                            className="text-destructive focus:text-destructive"
                          >
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
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={onAddItemClick} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add New Item
        </Button>
      </CardFooter>
    </Card>
  );
};

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowUpDown, MoreVertical, PackageOpen, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SupplyItem } from "@/types/shoppingList";

interface InventoryListProps {
  supplies: SupplyItem[];
  isLoading: boolean;
  onUpdateStock: (item: SupplyItem) => void;
  onDeleteItem: (id: string) => void;
  onAddToShoppingList: (item: SupplyItem) => void;
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
  onAddToShoppingList,
  onAddItemClick,
  onEditItem,
  onViewHistory,
  sortOrder = 'stock-asc',
  onSortChange
}: InventoryListProps) => {
  const { toast } = useToast();
  
  // Sort supplies based on selected sort order
  const sortedSupplies = React.useMemo(() => {
    const sorted = [...supplies];
    
    switch(sortOrder) {
      case 'stock-asc':
        return sorted.sort((a, b) => 
          (a.current_count / a.total_count) - (b.current_count / b.total_count)
        );
      case 'stock-desc':
        return sorted.sort((a, b) => 
          (b.current_count / b.total_count) - (a.current_count / a.total_count)
        );
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'category':
        return sorted.sort((a, b) => a.category.localeCompare(b.category));
      case 'course':
        return sorted.sort((a, b) => a.course.localeCompare(b.course));
      case 'threshold':
        // Sort by how close items are to their threshold (critical first)
        return sorted.sort((a, b) => {
          const aDiff = a.current_count - a.threshold;
          const bDiff = b.current_count - b.threshold;
          return aDiff - bDiff;
        });
      default:
        return sorted;
    }
  }, [supplies, sortOrder]);

  // Handle sort button click - cycle through sort options
  const handleSortClick = () => {
    const sortOptions = ['stock-asc', 'stock-desc', 'name-asc', 'name-desc', 'category', 'course', 'threshold'];
    const currentIndex = sortOptions.indexOf(sortOrder);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    onSortChange(sortOptions[nextIndex]);
  };

  // Get sort display name
  const getSortDisplayName = () => {
    switch(sortOrder) {
      case 'stock-asc': return 'Stock ↑';
      case 'stock-desc': return 'Stock ↓';
      case 'name-asc': return 'Name A-Z';
      case 'name-desc': return 'Name Z-A';
      case 'category': return 'Category';
      case 'course': return 'Course';
      case 'threshold': return 'Critical First';
      default: return 'Sort';
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center">
          <CardTitle>Supply Inventory</CardTitle>
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
                      <span className={item.current_count <= item.threshold ? "text-destructive font-bold" : ""}>
                        {item.current_count}/{item.total_count}
                      </span>
                      <Progress 
                        value={(item.current_count / item.total_count) * 100} 
                        className="w-20 h-2"
                        aria-label="Stock level"
                      />
                      {item.current_count <= item.threshold && (
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
                        <DropdownMenuItem onClick={() => onUpdateStock(item)}>
                          Update Stock
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditItem(item)}>
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddToShoppingList(item)}>
                          Add to Shopping List
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewHistory(item)}>
                          View History
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => onDeleteItem(item.id)}
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
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2"
          onClick={onAddItemClick}
        >
          <Plus className="h-4 w-4" />
          <span>Add New Item</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

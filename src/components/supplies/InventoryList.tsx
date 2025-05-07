
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowUpDown, MoreVertical, PackageOpen, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface InventoryListProps {
  supplies: SupplyItem[];
  isLoading: boolean;
  onUpdateStock: (item: SupplyItem) => void;
  onDeleteItem: (id: string) => void;
  onAddToShoppingList: (item: SupplyItem) => void;
}

export const InventoryList = ({ 
  supplies,
  isLoading,
  onUpdateStock,
  onDeleteItem,
  onAddToShoppingList
}: InventoryListProps) => {
  const { toast } = useToast();
  
  // Sort supplies by current/total ratio (ascending)
  const sortedSupplies = [...supplies].sort((a, b) => 
    (a.current_count / a.total_count) - (b.current_count / b.total_count)
  );
  
  return (
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
                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddToShoppingList(item)}>
                          Add to Shopping List
                        </DropdownMenuItem>
                        <DropdownMenuItem>View History</DropdownMenuItem>
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
        <Button variant="outline" className="w-full flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Add New Item</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

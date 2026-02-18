import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface SearchAndFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showLowStockOnly?: boolean;
  setShowLowStockOnly?: (show: boolean) => void;
  lowStockCount?: number;
}

export const SearchAndFilter = ({
  searchQuery,
  setSearchQuery,
  showLowStockOnly = false,
  setShowLowStockOnly,
  lowStockCount = 0
}: SearchAndFilterProps) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            className="pl-9 mx-[10px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} />

        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              <span>Filter</span>
              {showLowStockOnly &&
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  1
                </Badge>
              }
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showLowStockOnly}
              onCheckedChange={setShowLowStockOnly}
              className="flex items-center gap-2">

              <AlertTriangle className="h-4 w-4 text-destructive" />
              Low Stock Only
              {lowStockCount > 0 &&
              <Badge variant="destructive" className="ml-auto">
                  {lowStockCount}
                </Badge>
              }
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>);

};
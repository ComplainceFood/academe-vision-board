
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, ListFilter } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface NoteSortingProps {
  sortField: string;
  setSortField: (field: string) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  viewMode: 'list' | 'grid' | 'compact';
  setViewMode: (mode: 'list' | 'grid' | 'compact') => void;
}

export function NoteSorting({ 
  sortField, 
  setSortField, 
  sortDirection, 
  setSortDirection,
  viewMode,
  setViewMode
}: NoteSortingProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={sortField} onValueChange={setSortField}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="course">Course</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            title={sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'}
          >
            {sortDirection === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="hidden sm:block">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1"
          >
            <ListFilter className="h-4 w-4" />
            <span className="hidden md:inline">{isExpanded ? 'Less options' : 'More options'}</span>
          </Button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="bg-muted/30 p-3 rounded-md">
          <div className="space-y-2">
            <Label>View Mode</Label>
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'list' | 'grid' | 'compact')}>
              <ToggleGroupItem value="list" aria-label="List view">List</ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="Grid view">Grid</ToggleGroupItem>
              <ToggleGroupItem value="compact" aria-label="Compact view">Compact</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      )}
    </div>
  );
}

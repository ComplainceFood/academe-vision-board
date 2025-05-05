
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter, Search, X } from "lucide-react";
import { format } from "date-fns";

interface NoteFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  appliedFilters: {
    type?: string;
    course?: string;
    fromDate?: Date | null;
    toDate?: Date | null;
  };
  setAppliedFilters: (filters: any) => void;
}

export function NoteFilters({ 
  searchQuery, 
  setSearchQuery,
  appliedFilters,
  setAppliedFilters 
}: NoteFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(appliedFilters);
  
  const clearFilter = (key: keyof typeof appliedFilters) => {
    const newFilters = { ...appliedFilters };
    delete newFilters[key];
    setAppliedFilters(newFilters);
  };
  
  const applyFilters = () => {
    setAppliedFilters(tempFilters);
    setIsFilterOpen(false);
  };
  
  const resetFilters = () => {
    setTempFilters({});
  };
  
  const hasActiveFilters = Object.keys(appliedFilters).length > 0;
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search notes..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1.5 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={hasActiveFilters ? "bg-primary/10" : ""}>
              <Filter className="h-4 w-4 mr-2" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">
                  {Object.keys(appliedFilters).length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <h4 className="font-medium">Filter Notes</h4>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select 
                  value={tempFilters.type || ""} 
                  onValueChange={(value) => setTempFilters({ ...tempFilters, type: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any type</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="promise">Promise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <Input 
                  placeholder="Filter by course"
                  value={tempFilters.course || ""}
                  onChange={(e) => setTempFilters({ ...tempFilters, course: e.target.value || undefined })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <div className="flex flex-col gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tempFilters.fromDate ? format(tempFilters.fromDate, "PPP") : "From date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={tempFilters.fromDate || undefined}
                        onSelect={(date) => setTempFilters({ ...tempFilters, fromDate: date })}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tempFilters.toDate ? format(tempFilters.toDate, "PPP") : "To date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={tempFilters.toDate || undefined}
                        onSelect={(date) => setTempFilters({ ...tempFilters, toDate: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Reset
                </Button>
                <Button size="sm" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {appliedFilters.type && (
            <div className="flex items-center bg-muted px-2.5 py-1 rounded-full text-xs">
              <span>Type: {appliedFilters.type}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1" 
                onClick={() => clearFilter("type")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          {appliedFilters.course && (
            <div className="flex items-center bg-muted px-2.5 py-1 rounded-full text-xs">
              <span>Course: {appliedFilters.course}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1" 
                onClick={() => clearFilter("course")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          {appliedFilters.fromDate && (
            <div className="flex items-center bg-muted px-2.5 py-1 rounded-full text-xs">
              <span>From: {format(appliedFilters.fromDate, "MMM d, yyyy")}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1" 
                onClick={() => clearFilter("fromDate")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          {appliedFilters.toDate && (
            <div className="flex items-center bg-muted px-2.5 py-1 rounded-full text-xs">
              <span>To: {format(appliedFilters.toDate, "MMM d, yyyy")}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1" 
                onClick={() => clearFilter("toDate")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs" 
              onClick={() => setAppliedFilters({})}
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

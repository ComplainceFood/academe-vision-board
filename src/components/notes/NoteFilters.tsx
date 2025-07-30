
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter, Search, X, Tag, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";

interface NoteFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  appliedFilters: {
    type?: string;
    course?: string;
    fromDate?: Date | null;
    toDate?: Date | null;
    tags?: string[];
    hasAttachments?: boolean;
  };
  setAppliedFilters: (filters: any) => void;
  isLoading?: boolean;
  availableTags?: string[];
}

export function NoteFilters({ 
  searchQuery, 
  setSearchQuery,
  appliedFilters,
  setAppliedFilters,
  isLoading = false,
  availableTags = []
}: NoteFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(appliedFilters);
  const [selectedTag, setSelectedTag] = useState<string>("");
  
  const clearFilter = (key: keyof typeof appliedFilters) => {
    const newFilters = { ...appliedFilters };
    delete newFilters[key];
    setAppliedFilters(newFilters);
  };
  
  const clearTagFilter = (tag: string) => {
    const newTags = appliedFilters.tags?.filter(t => t !== tag) || [];
    setAppliedFilters({ 
      ...appliedFilters, 
      tags: newTags.length > 0 ? newTags : undefined 
    });
  };
  
  const applyFilters = () => {
    setAppliedFilters(tempFilters);
    setIsFilterOpen(false);
  };
  
  const resetFilters = () => {
    setTempFilters({});
  };
  
  const hasActiveFilters = Object.keys(appliedFilters).length > 0;
  
  const addTag = () => {
    if (selectedTag && (!tempFilters.tags || !tempFilters.tags.includes(selectedTag))) {
      const updatedTags = [...(tempFilters.tags || []), selectedTag];
      setTempFilters({ ...tempFilters, tags: updatedTags });
      setSelectedTag("");
    }
  };
  
  const removeTag = (tag: string) => {
    const updatedTags = tempFilters.tags?.filter(t => t !== tag) || [];
    setTempFilters({ 
      ...tempFilters, 
      tags: updatedTags.length > 0 ? updatedTags : undefined 
    });
  };
  
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
            disabled={isLoading}
          />
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1.5 h-7 w-7"
              onClick={() => setSearchQuery("")}
              disabled={isLoading}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={hasActiveFilters ? "bg-primary/10" : ""} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Filter className="h-4 w-4 mr-2" />
              )}
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
                    <SelectItem value="commitment">Commitment</SelectItem>
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
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={tempFilters.fromDate || undefined}
                        onSelect={(date) => setTempFilters({ ...tempFilters, fromDate: date })}
                        initialFocus
                        className="pointer-events-auto"
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
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={tempFilters.toDate || undefined}
                        onSelect={(date) => setTempFilters({ ...tempFilters, toDate: date })}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex gap-2">
                  <Select 
                    value={selectedTag} 
                    onValueChange={setSelectedTag}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTags.map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addTag}
                    disabled={!selectedTag}
                    className="shrink-0"
                  >
                    Add
                  </Button>
                </div>

                {tempFilters.tags && tempFilters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tempFilters.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        <span>{tag}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent" 
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Options</label>
                <div>
                  <Toggle 
                    aria-label="Toggle has attachments"
                    pressed={!!tempFilters.hasAttachments}
                    onPressedChange={(pressed) => 
                      setTempFilters({ ...tempFilters, hasAttachments: pressed || undefined })
                    }
                  >
                    Has attachments
                  </Toggle>
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
          {appliedFilters.hasAttachments && (
            <div className="flex items-center bg-muted px-2.5 py-1 rounded-full text-xs">
              <span>Has attachments</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1" 
                onClick={() => clearFilter("hasAttachments")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          {appliedFilters.tags && appliedFilters.tags.length > 0 && (
            appliedFilters.tags.map(tag => (
              <div key={tag} className="flex items-center bg-muted px-2.5 py-1 rounded-full text-xs">
                <Tag className="h-3 w-3 mr-1" />
                <span>Tag: {tag}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1" 
                  onClick={() => clearTagFilter(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))
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

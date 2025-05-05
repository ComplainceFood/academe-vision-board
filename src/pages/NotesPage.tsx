
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateNoteDialog } from "@/components/notes/CreateNoteDialog";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteFilters } from "@/components/notes/NoteFilters";
import { NoteSorting } from "@/components/notes/NoteSorting";
import { 
  Mic,
  BookText,
  List,
  Star,
} from "lucide-react";
import { useDataFetching } from "@/hooks/useDataFetching";
import type { Database } from "@/integrations/supabase/types";

type Note = Database['public']['Tables']['notes']['Row'];

const NotesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
  const [appliedFilters, setAppliedFilters] = useState<{
    type?: string;
    course?: string;
    fromDate?: Date | null;
    toDate?: Date | null;
    tags?: string[];
    hasAttachments?: boolean;
  }>({});
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  const { data: notes, isLoading, refetch } = useDataFetching<Note>({ table: 'notes' });
  
  // Extract unique tags from all notes
  useEffect(() => {
    if (notes && notes.length > 0) {
      const allTags = notes.reduce<string[]>((acc, note) => {
        if (note.tags && Array.isArray(note.tags)) {
          return [...acc, ...note.tags];
        }
        return acc;
      }, []);
      
      // Get unique tags
      const uniqueTags = Array.from(new Set(allTags));
      setAvailableTags(uniqueTags);
    }
  }, [notes]);

  const filteredNotes = notes.filter(note => {
    // Text search filter
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    // Tab filter
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "promises" && note.type === "promise") ||
      (activeTab === "notes" && note.type === "note") ||
      (activeTab === "starred" && note.starred);
    
    // Applied filters
    const matchesType = !appliedFilters.type || note.type === appliedFilters.type;
    const matchesCourse = !appliedFilters.course || 
      note.course.toLowerCase().includes(appliedFilters.course.toLowerCase());
    
    // Date filters
    const noteDate = new Date(note.date || '');
    const matchesFromDate = !appliedFilters.fromDate || 
      noteDate >= appliedFilters.fromDate;
    const matchesToDate = !appliedFilters.toDate || 
      noteDate <= appliedFilters.toDate;
    
    // Tags filter
    const matchesTags = !appliedFilters.tags || !appliedFilters.tags.length || 
      (note.tags && appliedFilters.tags.every(tag => 
        note.tags?.includes(tag)
      ));
      
    // Attachments filter (placeholder since we don't have attachments yet)
    const matchesAttachments = !appliedFilters.hasAttachments;
    
    return matchesSearch && matchesTab && matchesType && 
           matchesCourse && matchesFromDate && matchesToDate && 
           matchesTags && matchesAttachments;
  });
  
  // Sort filtered notes
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    let compareResult = 0;
    
    if (sortField === "date") {
      compareResult = new Date(a.date || '').getTime() - new Date(b.date || '').getTime();
    } else if (sortField === "title") {
      compareResult = a.title.localeCompare(b.title);
    } else if (sortField === "course") {
      compareResult = a.course.localeCompare(b.course);
    } else if (sortField === "type") {
      compareResult = a.type.localeCompare(b.type);
    }
    
    return sortDirection === 'asc' ? compareResult : -compareResult;
  });

  const handleNoteUpdate = () => {
    refetch();
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Notes & Promises</h1>
            <p className="text-muted-foreground">Track your class promises and notes</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <CreateNoteDialog />
            <Button variant="outline" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span>Record</span>
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <NoteFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            appliedFilters={appliedFilters}
            setAppliedFilters={setAppliedFilters}
            isLoading={isLoading}
            availableTags={availableTags}
          />
        </div>

        <div className="mb-6">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <TabsList className="grid w-full sm:w-auto grid-cols-4">
                <TabsTrigger value="all" className="flex items-center gap-1">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">All</span>
                  <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{notes.length}</span>
                </TabsTrigger>
                <TabsTrigger value="promises" className="flex items-center gap-1">
                  <BookText className="h-4 w-4" />
                  <span className="hidden sm:inline">Promises</span>
                  <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                    {notes.filter(note => note.type === "promise").length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center gap-1">
                  <BookText className="h-4 w-4" />
                  <span className="hidden sm:inline">Notes</span>
                  <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                    {notes.filter(note => note.type === "note").length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="starred" className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">Starred</span>
                  <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                    {notes.filter(note => note.starred).length}
                  </span>
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-4 sm:mt-0">
                <NoteSorting
                  sortField={sortField}
                  setSortField={setSortField}
                  sortDirection={sortDirection}
                  setSortDirection={setSortDirection}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                />
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading notes...</p>
              </div>
            ) : (
              <>
                <TabsContent value="all" className="mt-4">
                  <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : ''}`}>
                    {sortedNotes.length > 0 ? (
                      sortedNotes.map(note => (
                        <NoteCard 
                          key={note.id} 
                          note={note} 
                          onUpdate={handleNoteUpdate}
                          className={viewMode === 'compact' ? 'mb-2 py-2' : ''} 
                          compact={viewMode === 'compact'} 
                        />
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <BookText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <h3 className="text-lg font-medium mb-1">No notes found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or filters</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="promises" className="mt-4">
                  <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : ''}`}>
                    {sortedNotes.length > 0 ? (
                      sortedNotes.map(note => (
                        <NoteCard 
                          key={note.id} 
                          note={note} 
                          onUpdate={handleNoteUpdate}
                          className={viewMode === 'compact' ? 'mb-2 py-2' : ''} 
                          compact={viewMode === 'compact'} 
                        />
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <BookText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <h3 className="text-lg font-medium mb-1">No promises found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or filters</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="notes" className="mt-4">
                  <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : ''}`}>
                    {sortedNotes.length > 0 ? (
                      sortedNotes.map(note => (
                        <NoteCard 
                          key={note.id} 
                          note={note} 
                          onUpdate={handleNoteUpdate}
                          className={viewMode === 'compact' ? 'mb-2 py-2' : ''} 
                          compact={viewMode === 'compact'} 
                        />
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <BookText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <h3 className="text-lg font-medium mb-1">No notes found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or filters</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="starred" className="mt-4">
                  <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : ''}`}>
                    {sortedNotes.length > 0 ? (
                      sortedNotes.map(note => (
                        <NoteCard 
                          key={note.id} 
                          note={note} 
                          onUpdate={handleNoteUpdate}
                          className={viewMode === 'compact' ? 'mb-2 py-2' : ''} 
                          compact={viewMode === 'compact'} 
                        />
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Star className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <h3 className="text-lg font-medium mb-1">No starred items</h3>
                        <p className="text-muted-foreground">Star important notes to find them quickly</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotesPage;


import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useDataFetching } from "@/hooks/useDataFetching";
import { NoteCard } from "@/components/notes/NoteCard";
import { CreateNoteDialog } from "@/components/notes/CreateNoteDialog";
import { NoteFilters } from "@/components/notes/NoteFilters";
import { NoteSorting } from "@/components/notes/NoteSorting";

interface Note {
  id: string;
  title: string;
  content: string;
  type: string;
  course: string;
  student?: string;
  tags: string[];
  starred: boolean;
  date: string;
  user_id: string;
}

const NotesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch notes data
  const { 
    data: notes, 
    isLoading, 
    error,
    refetch 
  } = useDataFetching<Note>({ 
    table: 'notes',
    enabled: !!user
  });

  // Filter and sort notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === "all" || note.type === selectedType;
    const matchesCourse = selectedCourse === "all" || note.course === selectedCourse;
    const matchesStarred = !showStarredOnly || note.starred;
    
    return matchesSearch && matchesType && matchesCourse && matchesStarred;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "course":
        comparison = a.course.localeCompare(b.course);
        break;
      case "type":
        comparison = a.type.localeCompare(b.type);
        break;
      case "date":
      default:
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Get unique courses and types for filters
  const courses = [...new Set(notes.map(note => note.course))];
  const types = [...new Set(notes.map(note => note.type))];

  // Stats
  const totalNotes = notes.length;
  const starredNotes = notes.filter(note => note.starred).length;
  const notesByType = types.reduce((acc, type) => {
    acc[type] = notes.filter(note => note.type === type).length;
    return acc;
  }, {} as Record<string, number>);

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Failed to load notes</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              Notes & Promises
            </h1>
            <p className="text-muted-foreground">Manage your teaching notes, student observations, and promises</p>
          </div>
          <Button 
            className="mt-4 md:mt-0 flex items-center gap-2"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>New Note</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">Total Notes</div>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{totalNotes}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">Starred</div>
              <div className="h-4 w-4 text-yellow-500">⭐</div>
            </div>
            <div className="text-2xl font-bold">{starredNotes}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">Courses</div>
              <div className="h-4 w-4 text-blue-500">📚</div>
            </div>
            <div className="text-2xl font-bold">{courses.length}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">Types</div>
              <div className="h-4 w-4 text-green-500">🏷️</div>
            </div>
            <div className="text-2xl font-bold">{types.length}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes, content, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <NoteFilters
              selectedType={selectedType}
              selectedCourse={selectedCourse}
              showStarredOnly={showStarredOnly}
              types={types}
              courses={courses}
              onTypeChange={setSelectedType}
              onCourseChange={setSelectedCourse}
              onStarredChange={setShowStarredOnly}
            />
            <NoteSorting
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </div>
        </div>

        {/* Notes Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4 animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-4 w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
              </div>
            ))
          ) : filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onUpdate={() => refetch()}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No notes found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedType !== "all" || selectedCourse !== "all" || showStarredOnly
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first note"}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Note
              </Button>
            </div>
          )}
        </div>

        {/* Type Summary */}
        {notes.length > 0 && (
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-3">Notes by Type</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(notesByType).map(([type, count]) => (
                <Badge key={type} variant="secondary" className="text-sm">
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Note Dialog */}
      <CreateNoteDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onNoteCreated={() => {
          refetch();
          setIsCreateDialogOpen(false);
        }}
      />
    </MainLayout>
  );
};

export default NotesPage;

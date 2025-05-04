
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateNoteDialog } from "@/components/notes/CreateNoteDialog";
import { NoteCard } from "@/components/notes/NoteCard";
import { 
  Search, 
  Mic,
  Filter,
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
  const { data: notes, isLoading, refetch } = useDataFetching<Note>({ table: 'notes' });
  
  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "promises" && note.type === "promise") ||
      (activeTab === "notes" && note.type === "note") ||
      (activeTab === "starred" && note.starred);
      
    return matchesSearch && matchesTab;
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search notes..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              <span>Filter</span>
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
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
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading notes...</p>
              </div>
            ) : (
              <>
                <TabsContent value="all" className="mt-4">
                  {filteredNotes.length > 0 ? (
                    filteredNotes.map(note => (
                      <NoteCard key={note.id} note={note} onUpdate={handleNoteUpdate} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <BookText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium mb-1">No notes found</h3>
                      <p className="text-muted-foreground">Try adjusting your search or filters</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="promises" className="mt-4">
                  {filteredNotes.length > 0 ? (
                    filteredNotes.map(note => (
                      <NoteCard key={note.id} note={note} onUpdate={handleNoteUpdate} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <BookText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium mb-1">No promises found</h3>
                      <p className="text-muted-foreground">Try adjusting your search or filters</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="notes" className="mt-4">
                  {filteredNotes.length > 0 ? (
                    filteredNotes.map(note => (
                      <NoteCard key={note.id} note={note} onUpdate={handleNoteUpdate} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <BookText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium mb-1">No notes found</h3>
                      <p className="text-muted-foreground">Try adjusting your search or filters</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="starred" className="mt-4">
                  {filteredNotes.length > 0 ? (
                    filteredNotes.map(note => (
                      <NoteCard key={note.id} note={note} onUpdate={handleNoteUpdate} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium mb-1">No starred items</h3>
                      <p className="text-muted-foreground">Star important notes to find them quickly</p>
                    </div>
                  )}
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

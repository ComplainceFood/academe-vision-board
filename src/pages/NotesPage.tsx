
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  Mic, 
  Calendar, 
  Tag, 
  User,
  Filter,
  BookText,
  List,
  Star,
  MoreVertical,
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

interface Note {
  id: string;
  title: string;
  content: string;
  type: string;
  course: string;
  date: string;
  tags: string[];
  student?: string;
  starred?: boolean;
}

const NoteCard = ({ note }: { note: Note }) => (
  <Card className="mb-4 glassmorphism">
    <CardHeader className="pb-2 flex flex-row justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded ${note.type === 'promise' ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary'}`}>
            {note.type}
          </span>
          <span className="text-xs bg-muted px-2 py-1 rounded">{note.course}</span>
          {note.starred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
        </div>
        <CardTitle className="text-lg mt-2">{note.title}</CardTitle>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
          <DropdownMenuItem>Mark as Complete</DropdownMenuItem>
          <DropdownMenuItem>{note.starred ? 'Unstar' : 'Star'}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardHeader>
    <CardContent>
      <p className="text-sm mb-3">{note.content}</p>
      
      <div className="flex flex-wrap gap-2 mb-2">
        {note.tags && note.tags.map((tag) => (
          <span key={tag} className="text-xs bg-accent/15 text-accent px-2 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>
      
      <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{new Date(note.date).toLocaleDateString()}</span>
        </div>
        {note.student && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{note.student}</span>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const NotesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setNotes(data as Note[]);
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        toast({
          title: "Error fetching notes",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!authLoading && user) {
      fetchNotes();
    }
  }, [user, authLoading, toast]);
  
  const filteredNotes = notes.filter(note => {
    // Filter by search query
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      
    // Filter by tab
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "promises" && note.type === "promise") ||
      (activeTab === "notes" && note.type === "note") ||
      (activeTab === "starred" && note.starred);
      
    return matchesSearch && matchesTab;
  });

  const handleCreateNote = async () => {
    // This is just a placeholder for now
    toast({
      title: "Feature coming soon",
      description: "Note creation will be implemented in the next update."
    });
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
            <Button className="flex items-center gap-2" onClick={handleCreateNote}>
              <Plus className="h-4 w-4" />
              <span>New Note</span>
            </Button>
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
                    filteredNotes.map(note => <NoteCard key={note.id} note={note} />)
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
                    filteredNotes.map(note => <NoteCard key={note.id} note={note} />)
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
                    filteredNotes.map(note => <NoteCard key={note.id} note={note} />)
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
                    filteredNotes.map(note => <NoteCard key={note.id} note={note} />)
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

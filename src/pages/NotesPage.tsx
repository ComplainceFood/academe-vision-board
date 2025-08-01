import React, { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  Star, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Calendar,
  BookOpen,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { CreateNoteDialog } from '@/components/notes/CreateNoteDialog';
import { NoteCard } from '@/components/notes/NoteCard';
import { Note } from '@/types/notes';

const NotesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'all' | 'starred'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { notes, isLoading, deleteNote, toggleStar, toggleStatus, error } = useNotes();

  console.log('NotesPage - notes data:', notes, 'isLoading:', isLoading, 'error:', error);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // The useNotes hook will automatically refetch due to React Query's stale time settings
      window.dispatchEvent(new CustomEvent('refreshData'));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Filter and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes.filter(note => {
      const matchesSearch = 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.student_name && note.student_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedType === 'all' || note.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || note.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || note.priority === selectedPriority;
      const matchesView = viewMode === 'all' || (viewMode === 'starred' && note.starred);

      return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesView;
    });

    // Sort notes
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'course':
          aValue = a.course.toLowerCase();
          bValue = b.course.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [notes, searchQuery, selectedType, selectedStatus, selectedPriority, sortBy, sortOrder, viewMode]);

  // Get simplified statistics
  const stats = useMemo(() => {
    const totalNotes = notes.length;
    const activeNotes = notes.filter(n => n.status === 'active').length;
    const starredNotes = notes.filter(n => n.starred).length;
    const urgentNotes = notes.filter(n => n.priority === 'urgent' && n.status === 'active').length;

    return {
      totalNotes,
      activeNotes,
      starredNotes,
      urgentNotes,
    };
  }, [notes]);

  const typeLabels = {
    note: 'Notes',
    commitment: 'Commitments',
    reminder: 'Reminders',
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading notes...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Notes & Commitments</h1>
            <p className="text-muted-foreground">Manage your academic notes, commitments, and reminders</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Note
          </Button>
        </div>

        {/* Simplified Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalNotes}</p>
                  <p className="text-sm text-muted-foreground">Total Notes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeNotes}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.starredNotes}</p>
                  <p className="text-sm text-muted-foreground">Starred</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.urgentNotes}</p>
                  <p className="text-sm text-muted-foreground">Urgent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Simplified Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes, content, courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[130px] bg-background">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="note">Notes</SelectItem>
                    <SelectItem value="commitment">Commitments</SelectItem>
                    <SelectItem value="reminder">Reminders</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-[120px] bg-background">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] bg-background">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="created_at">Most Recent</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simplified Tabs */}
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'all' | 'starred')}>
          <TabsList className="bg-background">
            <TabsTrigger value="all">All Notes ({filteredAndSortedNotes.length})</TabsTrigger>
            <TabsTrigger value="starred">Starred ({stats.starredNotes})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredAndSortedNotes.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No notes found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || selectedType !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all'
                      ? 'Try adjusting your filters or search terms.'
                      : 'Create your first note to get started.'
                    }
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedNotes.map((note) => (
                  <NoteCard 
                    key={note.id} 
                    note={note as any} 
                    onUpdate={() => {}}
                    onDelete={deleteNote}
                    onToggleStar={toggleStar}
                    onToggleStatus={toggleStatus}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="starred">
            {/* Starred notes content - same structure as all notes but filtered */}
            <div className="space-y-4">
            {filteredAndSortedNotes.filter(note => note.starred).map((note) => (
              <NoteCard 
                key={note.id} 
                note={note as any} 
                onUpdate={() => {}}
                onDelete={deleteNote}
                onToggleStar={toggleStar}
                onToggleStatus={toggleStatus}
              />
            ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Note Dialog */}
        <CreateNoteDialog 
          open={isCreateDialogOpen} 
          onOpenChange={setIsCreateDialogOpen} 
        />
      </div>
    </MainLayout>
  );
};

export default NotesPage;
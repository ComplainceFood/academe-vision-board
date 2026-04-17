import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/MainLayout';
import { PageGuide } from '@/components/common/PageGuide';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  ListTodo,
  StickyNote,
  GraduationCap,
  Users,
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Star,
  Trash2,
  Edit,
  Eye,
  MoreHorizontal,
  Clock,
  Repeat,
  FolderOpen
} from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { CreateTaskDialog } from '@/components/notes/CreateTaskDialog';
import { TaskItem } from '@/components/notes/TaskItem';
import { QuickNoteInput } from '@/components/notes/QuickNoteInput';
import { EditNoteDialog } from '@/components/notes/EditNoteDialog';
import { ViewNoteDialog } from '@/components/notes/ViewNoteDialog';
import { EditTaskDialog } from '@/components/notes/EditTaskDialog';
import { FolderSidebar } from '@/components/notes/FolderSidebar';
import { getDeadlineGroup, DEADLINE_GROUP_ORDER, DEADLINE_GROUP_LABELS } from '@/components/notes/SmartDeadlineIndicator';
import { Note } from '@/types/notes';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Academic categories for teachers
const CATEGORIES = [
  { id: 'all', label: 'All Tasks', icon: ListTodo },
  { id: 'teaching', label: 'Teaching', icon: GraduationCap },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'admin', label: 'Admin', icon: FileText },
  { id: 'meetings', label: 'Meetings', icon: Calendar },
  { id: 'grading', label: 'Grading', icon: Clock },
];

const NotesPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [groupByDeadline, setGroupByDeadline] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  // Dialog states for notes
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isViewNoteOpen, setIsViewNoteOpen] = useState(false);
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
  const [isDeleteNoteOpen, setIsDeleteNoteOpen] = useState(false);
  
  // Dialog states for tasks
  const [selectedTask, setSelectedTask] = useState<Note | null>(null);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);

  const { 
    notes, 
    folders, 
    isLoading, 
    deleteNote, 
    toggleStar, 
    toggleStatus, 
    createNote, 
    createFolder, 
    updateSubtasks 
  } = useNotes();
  const { user } = useAuth();

  // Separate tasks from notes
  const { tasks, quickNotes } = useMemo(() => {
    const allTasks = notes.filter(n => n.type === 'commitment' || n.type === 'reminder');
    const allNotes = notes.filter(n => n.type === 'note');
    return { tasks: allTasks, quickNotes: allNotes };
  }, [notes]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.course.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || 
        task.course.toLowerCase() === selectedCategory.toLowerCase() ||
        task.tags?.some(tag => tag.toLowerCase() === selectedCategory.toLowerCase());

      const matchesCompleted = showCompleted || task.status !== 'completed';

      return matchesSearch && matchesCategory && matchesCompleted;
    }).sort((a, b) => {
      if (a.starred !== b.starred) return a.starred ? -1 : 1;
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tasks, searchQuery, selectedCategory, showCompleted]);

  // Group tasks by deadline
  const groupedTasks = useMemo(() => {
    if (!groupByDeadline) return { all: filteredTasks };
    
    const groups: Record<string, Note[]> = {};
    filteredTasks.forEach(task => {
      const group = getDeadlineGroup(task.due_date, task.status);
      if (!groups[group]) groups[group] = [];
      groups[group].push(task);
    });
    return groups;
  }, [filteredTasks, groupByDeadline]);

  // Filter notes by folder
  const filteredNotes = useMemo(() => {
    return quickNotes.filter(note => {
      const matchesSearch = 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFolder = selectedFolderId === null || note.parent_folder_id === selectedFolderId;
      return matchesSearch && matchesFolder;
    }).sort((a, b) => {
      if (a.starred !== b.starred) return a.starred ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [quickNotes, searchQuery, selectedFolderId]);

  // Statistics
  const stats = useMemo(() => {
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < new Date();
    }).length;

    const dueTodayTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      const today = new Date();
      const due = new Date(t.due_date);
      return due.toDateString() === today.toDateString();
    }).length;

    const recurringTasks = tasks.filter(t => t.recurrence_pattern && t.status === 'active').length;

    return {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      pendingTasks: tasks.filter(t => t.status === 'active').length,
      overdueTasks,
      dueTodayTasks,
      recurringTasks,
      totalNotes: quickNotes.length,
    };
  }, [tasks, quickNotes]);

  const handleQuickNote = async (title: string, content: string) => {
    if (!user) return;
    await createNote({
      title,
      content,
      type: 'note',
      course: 'Quick Notes',
      tags: [],
      starred: false,
      parent_folder_id: selectedFolderId,
    });
  };

  const handleQuickTask = async (title: string) => {
    if (!user) return;
    await createNote({
      title,
      content: '',
      type: 'commitment',
      course: selectedCategory === 'all' ? 'General' : selectedCategory,
      tags: selectedCategory !== 'all' ? [selectedCategory] : [],
      starred: false,
    });
  };

  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setIsViewNoteOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setIsEditNoteOpen(true);
    setIsViewNoteOpen(false);
  };

  const handleDeleteNote = async () => {
    if (selectedNote) {
      await deleteNote(selectedNote.id);
      setIsDeleteNoteOpen(false);
      setIsViewNoteOpen(false);
      setSelectedNote(null);
    }
  };

  const handleEditTask = (task: Note) => {
    setSelectedTask(task);
    setIsEditTaskOpen(true);
  };

  const handleCreateFolder = async (name: string, color: string) => {
    await createFolder({ title: name, folder_color: color });
  };

  const handleDeleteFolder = async (id: string) => {
    await deleteNote(id);
    if (selectedFolderId === id) {
      setSelectedFolderId(null);
    }
  };

  const handleUpdateSubtasks = async (noteId: string, subtasks: Note['subtasks']) => {
    if (subtasks) {
      await updateSubtasks({ noteId, subtasks });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageGuide page="notes" />
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-xl bg-primary p-3 sm:p-5 text-primary-foreground">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-secondary/20 rounded-full blur-3xl animate-pulse" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 shrink-0">
                  <ListTodo className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h1 className="text-base sm:text-xl font-bold">Academic Workspace</h1>
                  <p className="text-primary-foreground/80 text-xs mt-0.5">Manage tasks, track deadlines, and organize your notes</p>
                </div>
              </div>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                size="sm"
                className="bg-primary-foreground/15 hover:bg-primary-foreground/25 backdrop-blur-sm border border-primary-foreground/30 text-primary-foreground"
                variant="outline"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New Task
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
              {[
                { label: t('notes.pending'),   value: stats.pendingTasks,   bg: "bg-primary-foreground/15" },
                { label: t('notes.overdue'),   value: stats.overdueTasks,   bg: "bg-amber-500/70" },
                { label: t('notes.dueDate'), value: stats.dueTodayTasks,  bg: "bg-primary-foreground/15" },
                { label: t('notes.completed'), value: stats.completedTasks, bg: "bg-primary-foreground/15" },
                { label: t('notes.recurring'), value: stats.recurringTasks, bg: "bg-primary-foreground/15" },
                { label: t('nav.notes'),       value: stats.totalNotes,     bg: "bg-primary-foreground/15" },
              ].map(({ label, value, bg }) => (
                <div key={label} className={`${bg} backdrop-blur-sm rounded-lg px-3 py-1.5 border border-primary-foreground/20 text-center`}>
                  <p className="text-lg sm:text-2xl font-bold">{value}</p>
                  <p className="text-[10px] text-primary-foreground/70">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'tasks' | 'notes')} className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="tasks" className="gap-2">
                <ListTodo className="h-4 w-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <StickyNote className="h-4 w-4" />
                Notebooks
              </TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === 'tasks' ? t('notes.searchTasks') : t('notes.searchNotes')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Categories Sidebar */}
              <div className="lg:w-56 space-y-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('notes.categories')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const count = cat.id === 'all' 
                          ? tasks.filter(t => t.status !== 'completed').length
                          : tasks.filter(t => 
                              (t.course.toLowerCase() === cat.id || 
                               t.tags?.some(tag => tag.toLowerCase() === cat.id)) &&
                              t.status !== 'completed'
                            ).length;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                              selectedCategory === cat.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{cat.label}</span>
                            </div>
                            {count > 0 && (
                              <Badge variant={selectedCategory === cat.id ? "secondary" : "outline"} className="text-xs">
                                {count}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Filters */}
                <Card>
                  <CardContent className="p-3 space-y-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox 
                        checked={showCompleted} 
                        onCheckedChange={(checked) => setShowCompleted(checked as boolean)} 
                      />
                      Show completed
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox 
                        checked={groupByDeadline} 
                        onCheckedChange={(checked) => setGroupByDeadline(checked as boolean)} 
                      />
                      Group by deadline
                    </label>
                  </CardContent>
                </Card>
              </div>

              {/* Task List */}
              <div className="flex-1 space-y-4">
                {/* Quick Add Task */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('notes.addTaskPlaceholder')}
                        className="border-0 shadow-none focus-visible:ring-0 px-0"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            handleQuickTask(e.currentTarget.value.trim());
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Grouped Tasks */}
                {groupByDeadline ? (
                  DEADLINE_GROUP_ORDER.map(groupKey => {
                    const groupTasks = groupedTasks[groupKey];
                    if (!groupTasks || groupTasks.length === 0) return null;
                    
                    return (
                      <div key={groupKey} className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground px-1">
                          {DEADLINE_GROUP_LABELS[groupKey]} ({groupTasks.length})
                        </h3>
                        <div className="space-y-2">
                          {groupTasks.map((task) => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              onToggleStatus={toggleStatus}
                              onToggleStar={toggleStar}
                              onDelete={deleteNote}
                              onEdit={() => handleEditTask(task)}
                              onUpdateSubtasks={handleUpdateSubtasks}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <>
                    {filteredTasks.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <ListTodo className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                          <h3 className="font-medium mb-1">{t('notes.noTasksFound')}</h3>
                          <p className="text-sm text-muted-foreground">
                            {searchQuery ? 'Try a different search term' : 'Add your first task to get started'}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {filteredTasks.map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            onToggleStatus={toggleStatus}
                            onToggleStar={toggleStar}
                            onDelete={deleteNote}
                            onEdit={() => handleEditTask(task)}
                            onUpdateSubtasks={handleUpdateSubtasks}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Folder Sidebar */}
              <div className="lg:w-56">
                <FolderSidebar
                  folders={folders}
                  notes={quickNotes}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={setSelectedFolderId}
                  onCreateFolder={handleCreateFolder}
                  onDeleteFolder={handleDeleteFolder}
                />
              </div>

              {/* Notes Content */}
              <div className="flex-1 space-y-4">
                {/* Quick Note Input */}
                <QuickNoteInput onSave={handleQuickNote} />

                {/* Notes Grid */}
                {filteredNotes.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="font-medium mb-1">
                        {selectedFolderId ? 'No notes in this folder' : 'No notes yet'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Add a quick note above to get started
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredNotes.map((note) => (
                      <Card 
                        key={note.id} 
                        className={`group relative cursor-pointer hover:shadow-md transition-shadow ${note.starred ? 'ring-2 ring-amber-400/50' : ''}`}
                        onClick={() => handleViewNote(note)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium line-clamp-1 flex-1">{note.title}</h3>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewNote(note)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditNote(note)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleStar(note.id)}>
                                    <Star className={`h-4 w-4 mr-2 ${note.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                                    {note.starred ? 'Unstar' : 'Star'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => {
                                      setSelectedNote(note);
                                      setIsDeleteNoteOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{note.content}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.created_at).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-1">
                              {note.starred && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                              {note.course && note.course !== 'Quick Notes' && (
                                <Badge variant="secondary" className="text-xs">{note.course}</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <CreateTaskDialog 
          open={isCreateDialogOpen} 
          onOpenChange={setIsCreateDialogOpen}
          categories={CATEGORIES.filter(c => c.id !== 'all')}
        />

        <ViewNoteDialog
          note={selectedNote}
          open={isViewNoteOpen}
          onOpenChange={setIsViewNoteOpen}
          onEdit={() => handleEditNote(selectedNote!)}
          onDelete={() => {
            setIsViewNoteOpen(false);
            setIsDeleteNoteOpen(true);
          }}
        />

        <EditNoteDialog
          note={selectedNote}
          open={isEditNoteOpen}
          onOpenChange={setIsEditNoteOpen}
        />

        <EditTaskDialog
          task={selectedTask}
          open={isEditTaskOpen}
          onOpenChange={setIsEditTaskOpen}
          categories={CATEGORIES.filter(c => c.id !== 'all')}
        />

        <AlertDialog open={isDeleteNoteOpen} onOpenChange={setIsDeleteNoteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Note</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedNote?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default NotesPage;

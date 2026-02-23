import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useQueryClient } from "@tanstack/react-query";
import { Database, TestTube, RotateCcw, Zap, Info, CheckCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Enhanced mock data sets for academic administration
const mockDataSets = {
  notes: {
    name: "Academic Tasks & Notes",
    description: "Tasks, commitments, and quick notes for academic administration",
    count: 12,
    data: [
      // Tasks (type: commitment/reminder)
      {
        title: "Grade Midterm Exams",
        content: "Complete grading for CS101 midterm exams. 45 students submitted. Deadline: Friday.",
        type: "commitment",
        course: "Grading",
        priority: "urgent",
        tags: ["grading", "deadline"],
        starred: true
      },
      {
        title: "Submit Final Grades",
        content: "Submit all final grades to registrar office by end of semester.",
        type: "commitment",
        course: "Admin",
        priority: "high",
        tags: ["admin", "grades"],
        starred: false
      },
      {
        title: "Review Thesis Draft - Sarah Johnson",
        content: "Review Chapter 3 of Sarah's thesis on machine learning applications. Provide feedback on methodology section.",
        type: "commitment",
        course: "Students",
        priority: "high",
        tags: ["thesis", "review"],
        student_name: "Sarah Johnson"
      },
      {
        title: "Prepare Lecture Slides",
        content: "Update slides for next week's Data Structures lecture. Add new examples for binary trees.",
        type: "commitment",
        course: "Teaching",
        priority: "medium",
        tags: ["lecture", "preparation"]
      },
      {
        title: "Schedule Office Hours",
        content: "Set up additional office hours before final exams. Coordinate with TA availability.",
        type: "reminder",
        course: "Admin",
        priority: "medium",
        tags: ["office-hours", "scheduling"]
      },
      {
        title: "Department Meeting Preparation",
        content: "Prepare curriculum proposal presentation for department meeting next Monday.",
        type: "commitment",
        course: "Meetings",
        priority: "high",
        tags: ["meeting", "curriculum"],
        starred: true
      },
      {
        title: "Order Lab Equipment",
        content: "Submit purchase order for new Arduino kits and sensors for robotics course.",
        type: "reminder",
        course: "Admin",
        priority: "low",
        tags: ["supplies", "lab"]
      },
      // Quick Notes (type: note)
      {
        title: "Student Accommodation Request",
        content: "John D. requested extended time for exams due to documented disability. Approved - notify testing center.",
        type: "note",
        course: "Quick Notes",
        priority: "medium",
        tags: ["accommodation"]
      },
      {
        title: "Research Paper Ideas",
        content: "Potential topics: 1) AI in education assessment, 2) Gamification in programming courses, 3) Remote lab accessibility",
        type: "note",
        course: "Quick Notes",
        priority: "low",
        tags: ["research", "ideas"]
      },
      {
        title: "Conference Submission Deadline",
        content: "SIGCSE 2025 abstract deadline: March 15. Full paper due: April 20. Consider submitting the assessment tool paper.",
        type: "note",
        course: "Quick Notes",
        priority: "high",
        tags: ["conference", "deadline"],
        starred: true
      }
    ]
  },
  meetings: {
    name: "Academic Meetings",
    description: "Faculty meetings, student advising, and committee sessions",
    count: 6,
    data: [
      {
        title: "PhD Student Advisory Meeting",
        type: "one_on_one",
        status: "scheduled",
        start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_time: "10:00",
        end_time: "10:30",
        attendees: [{ name: "Sarah Johnson", email: "", status: "pending", required: true }],
        location: "Office 302",
        description: "Discuss thesis progress and timeline for defense.",
        agenda: "",
        notes: "",
        action_items: [],
        attachments: [],
        is_recurring: false,
        reminder_minutes: 15
      },
      {
        title: "Curriculum Committee Meeting",
        type: "group",
        status: "scheduled",
        start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_time: "14:00",
        end_time: "15:30",
        attendees: [
          { name: "Dr. Smith", email: "", status: "pending", required: true },
          { name: "Dr. Brown", email: "", status: "pending", required: true },
          { name: "Dr. Wilson", email: "", status: "pending", required: false }
        ],
        location: "Conference Room A",
        description: "Review proposed changes to undergraduate CS requirements.",
        agenda: "1. Review current curriculum\n2. Discuss proposed changes\n3. Vote on updates",
        notes: "",
        action_items: [],
        attachments: [],
        is_recurring: false,
        reminder_minutes: 15
      },
      {
        title: "Teaching Assistant Weekly Sync",
        type: "one_on_one",
        status: "scheduled",
        start_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_time: "15:00",
        end_time: "15:30",
        attendees: [{ name: "Michael Chen (TA)", email: "", status: "pending", required: true }],
        location: "Office 302",
        description: "Review grading rubric for upcoming assignment.",
        agenda: "",
        notes: "",
        action_items: [],
        attachments: [],
        is_recurring: true,
        recurring_pattern: "weekly",
        reminder_minutes: 15
      },
      {
        title: "Department Faculty Meeting",
        type: "group",
        status: "scheduled",
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_time: "09:00",
        end_time: "11:00",
        attendees: [{ name: "All Faculty", email: "", status: "pending", required: true }],
        location: "Main Conference Hall",
        description: "Monthly department meeting. Agenda: Budget review, hiring updates.",
        agenda: "Budget review, hiring updates, new course proposals",
        notes: "",
        action_items: [],
        attachments: [],
        is_recurring: true,
        recurring_pattern: "monthly",
        reminder_minutes: 30
      },
      {
        title: "Student Office Hours",
        type: "one_on_one",
        status: "scheduled",
        start_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_time: "13:00",
        end_time: "15:00",
        attendees: [],
        location: "Office 302",
        description: "Open office hours for CS101 and CS202 students.",
        agenda: "",
        notes: "",
        action_items: [],
        attachments: [],
        is_recurring: true,
        recurring_pattern: "weekly",
        reminder_minutes: 15
      },
      {
        title: "Research Collaboration Discussion",
        type: "one_on_one",
        status: "completed",
        start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_time: "11:00",
        end_time: "12:00",
        attendees: [{ name: "Dr. Emily Clark (External)", email: "", status: "accepted", required: true }],
        location: "Zoom",
        description: "Discussed potential NSF grant collaboration on AI education tools.",
        agenda: "",
        notes: "Discussed potential NSF grant collaboration on AI education tools.",
        action_items: [
          { id: "1", description: "Draft preliminary proposal outline", assignee: "Professor", due_date: "", completed: false, created_at: new Date().toISOString() },
          { id: "2", description: "Share previous research papers", assignee: "Professor", due_date: "", completed: false, created_at: new Date().toISOString() },
          { id: "3", description: "Schedule follow-up in 2 weeks", assignee: "Professor", due_date: "", completed: false, created_at: new Date().toISOString() }
        ],
        attachments: [],
        is_recurring: false,
        reminder_minutes: 15
      }
    ]
  },
  supplies: {
    name: "Lab & Office Supplies",
    description: "Teaching materials, lab equipment, and office supplies inventory",
    count: 15,
    data: [
      {
        name: "Dry Erase Markers (Assorted)",
        category: "Office Supplies",
        course: "General",
        current_count: 8,
        total_count: 50,
        threshold: 15,
        cost: 2.49
      },
      {
        name: "Arduino Uno Boards",
        category: "Lab Equipment",
        course: "CS202 - Embedded Systems",
        current_count: 12,
        total_count: 25,
        threshold: 8,
        cost: 24.99
      },
      {
        name: "Raspberry Pi 4 Kits",
        category: "Lab Equipment",
        course: "CS301 - IoT Applications",
        current_count: 6,
        total_count: 15,
        threshold: 5,
        cost: 89.99
      },
      {
        name: "USB-C Cables (6ft)",
        category: "Cables & Accessories",
        course: "General Lab",
        current_count: 25,
        total_count: 50,
        threshold: 10,
        cost: 8.99
      },
      {
        name: "Breadboards (Large)",
        category: "Lab Equipment",
        course: "CS202 - Embedded Systems",
        current_count: 4,
        total_count: 30,
        threshold: 10,
        cost: 5.99
      },
      {
        name: "LED Assortment Kit",
        category: "Components",
        course: "CS202 - Embedded Systems",
        current_count: 3,
        total_count: 10,
        threshold: 3,
        cost: 12.99
      },
      {
        name: "Printer Paper (Ream)",
        category: "Office Supplies",
        course: "General",
        current_count: 5,
        total_count: 20,
        threshold: 5,
        cost: 7.99
      },
      {
        name: "HDMI Cables (10ft)",
        category: "Cables & Accessories",
        course: "General Lab",
        current_count: 15,
        total_count: 20,
        threshold: 5,
        cost: 12.99
      }
    ]
  },
  expenses: {
    name: "Academic Expenses",
    description: "Course materials, equipment purchases, and professional development",
    count: 10,
    data: [
      {
        description: "SIGCSE Conference Registration",
        amount: 450.00,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: "Professional Development",
        course: "Research",
        receipt: true
      },
      {
        description: "Arduino Starter Kits (10x)",
        amount: 289.90,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: "Lab Equipment",
        course: "CS202",
        receipt: true
      },
      {
        description: "Textbooks for Course Development",
        amount: 156.45,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: "Course Materials",
        course: "CS101",
        receipt: true
      },
      {
        description: "Office Supplies Restock",
        amount: 67.32,
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: "Office Supplies",
        course: "General",
        receipt: true
      },
      {
        description: "Student Worker Hourly Wages",
        amount: 320.00,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: "Personnel",
        course: "Lab Support",
        receipt: false
      },
      {
        description: "Cloud Computing Credits (AWS)",
        amount: 150.00,
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: "Software & Services",
        course: "CS401",
        receipt: true
      }
    ]
  },
  planningEvents: {
    name: "Calendar Events",
    description: "Academic deadlines, exams, and important dates",
    count: 8,
    data: [
      {
        title: "CS101 Midterm Exam",
        type: "exam",
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: "14:00",
        end_time: "16:00",
        course: "CS101",
        priority: "high",
        location: "Lecture Hall A"
      },
      {
        title: "Project Proposal Deadline",
        type: "deadline",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: "23:59",
        course: "CS301",
        priority: "high"
      },
      {
        title: "Guest Lecture: Industry Speaker",
        type: "lecture",
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: "10:00",
        end_time: "11:30",
        course: "CS401",
        priority: "medium",
        location: "Room 205"
      },
      {
        title: "Final Exam Period Begins",
        type: "academic",
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: "08:00",
        priority: "high"
      }
    ]
  },
  futureTasksAndPlanning: {
    name: "Semester Planning",
    description: "Long-term planning and future semester preparation",
    count: 6,
    data: [
      {
        title: "Update CS101 Curriculum",
        semester: "Fall 2025",
        priority: "high",
        estimated_hours: 40,
        description: "Revise introductory programming curriculum to include Python alongside Java."
      },
      {
        title: "Develop New AI Ethics Course",
        semester: "Spring 2026",
        priority: "medium",
        estimated_hours: 60,
        description: "Create new elective course on ethical considerations in AI development."
      },
      {
        title: "Lab Equipment Modernization",
        semester: "Summer 2025",
        priority: "medium",
        estimated_hours: 20,
        description: "Replace aging computers in Lab 204 and upgrade to newer Raspberry Pi models."
      },
      {
        title: "Grant Proposal: NSF CAREER",
        semester: "Fall 2025",
        priority: "high",
        estimated_hours: 80,
        description: "Prepare and submit NSF CAREER award proposal on CS education research."
      }
    ]
  },
  feedback: {
    name: "Platform Feedback",
    description: "Sample feedback for testing the feedback system",
    count: 4,
    data: [
      {
        category: "feature_request",
        subject: "Calendar Integration with Canvas LMS",
        description: "Would be helpful to sync assignment deadlines from Canvas directly into the planning calendar.",
        priority: "high",
        status: "open"
      },
      {
        category: "bug_report",
        subject: "Meeting Reminder Notifications",
        description: "Meeting reminders are not showing up 15 minutes before as configured in settings.",
        priority: "medium",
        status: "in_progress",
        admin_response: "We've identified the issue and are working on a fix. Expected in next update."
      },
      {
        category: "general",
        subject: "Great Tool for Academic Management",
        description: "This platform has really helped me stay organized with grading, meetings, and supplies tracking. Thank you!",
        priority: "low",
        status: "closed",
        admin_response: "Thank you for the positive feedback! We're glad SmartProf is helping with your academic work."
      },
      {
        category: "supplies",
        subject: "Bulk Import for Inventory",
        description: "It would save time to be able to import supplies from a CSV or spreadsheet file.",
        priority: "medium",
        status: "open"
      }
    ]
  }
};

// Map from mockDataSets keys to actual Supabase table names
const tableMap: Record<string, string> = {
  notes: 'notes',
  meetings: 'meetings',
  supplies: 'supplies',
  expenses: 'expenses',
  planningEvents: 'planning_events',
  futureTasksAndPlanning: 'future_planning',
  feedback: 'feedback',
};

export function AdminSeedDataManager() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentSet, setCurrentSet] = useState("");
  const [seedResults, setSeedResults] = useState<{ [key: string]: { success: boolean; count: number; error?: string } }>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSystemAdmin, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();

  // Only show to system admin users
  if (roleLoading || !isSystemAdmin()) {
    return null;
  }

  async function deleteSelectedData() {
    if (!user || selectedSets.length === 0) {
      toast({
        title: "No data selected",
        description: "Please select at least one data set to delete",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDeleting(true);
      setProgress(0);
      setSeedResults({});

      const totalSets = selectedSets.length;
      let completedSets = 0;
      const results: { [key: string]: { success: boolean; count: number; error?: string } } = {};

      for (const setKey of selectedSets) {
        const mockSet = mockDataSets[setKey as keyof typeof mockDataSets];
        const tableName = tableMap[setKey];
        setCurrentSet(`Deleting ${mockSet.name}`);

        try {
          let deleteResult: { error: any; count: number | null };

          switch (setKey) {
            case 'notes':
              deleteResult = await supabase.from('notes').delete({ count: 'exact' }).eq('user_id', user.id);
              break;
            case 'meetings':
              deleteResult = await supabase.from('meetings').delete({ count: 'exact' }).eq('user_id', user.id);
              break;
            case 'supplies':
              deleteResult = await supabase.from('supplies').delete({ count: 'exact' }).eq('user_id', user.id);
              break;
            case 'expenses':
              deleteResult = await supabase.from('expenses').delete({ count: 'exact' }).eq('user_id', user.id);
              break;
            case 'planningEvents':
              deleteResult = await supabase.from('planning_events').delete({ count: 'exact' }).eq('user_id', user.id);
              break;
            case 'futureTasksAndPlanning':
              deleteResult = await supabase.from('future_planning').delete({ count: 'exact' }).eq('user_id', user.id);
              break;
            case 'feedback':
              deleteResult = await supabase.from('feedback').delete({ count: 'exact' }).eq('user_id', user.id);
              break;
            default:
              throw new Error(`Unknown data set: ${setKey}`);
          }

          if (deleteResult.error) throw deleteResult.error;

          results[setKey] = { success: true, count: deleteResult.count ?? 0 };

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: [tableName] });
          queryClient.invalidateQueries({ queryKey: [setKey] });
        } catch (error: any) {
          console.error(`Error deleting ${setKey}:`, error);
          results[setKey] = { success: false, count: 0, error: error.message };
        }

        completedSets++;
        setProgress((completedSets / totalSets) * 100);
        setSeedResults(results);
      }

      setCurrentSet("");

      // Notify other components
      window.dispatchEvent(new CustomEvent('seedDataCompleted', { detail: { userId: user.id, results } }));

      const successCount = Object.values(results).filter(r => r.success).length;
      const totalDeleted = Object.values(results).filter(r => r.success).reduce((sum, r) => sum + r.count, 0);

      toast({
        title: "Delete operation completed",
        description: `Deleted ${totalDeleted} records across ${successCount} tables`,
      });
    } catch (error: any) {
      console.error("Error during deletion:", error);
      toast({
        title: "Deletion failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  const handleSetSelection = (setKey: string, checked: boolean) => {
    if (checked) {
      setSelectedSets(prev => [...prev, setKey]);
    } else {
      setSelectedSets(prev => prev.filter(key => key !== setKey));
    }
  };

  const selectAllSets = () => {
    setSelectedSets(Object.keys(mockDataSets));
  };

  const clearSelection = () => {
    setSelectedSets([]);
  };

  const resetResults = () => {
    setSeedResults({});
    setProgress(0);
    setCurrentSet("");
  };

  async function seedSelectedData() {
    if (!user || selectedSets.length === 0) {
      toast({
        title: "No data selected",
        description: "Please select at least one data set to seed",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSeeding(true);
      setProgress(0);
      setSeedResults({});
      
      const totalSets = selectedSets.length;
      let completedSets = 0;
      const results: { [key: string]: { success: boolean; count: number; error?: string } } = {};

      for (const setKey of selectedSets) {
        const mockSet = mockDataSets[setKey as keyof typeof mockDataSets];
        setCurrentSet(mockSet.name);
        
        try {
          // Add user_id to each record and ensure proper field mapping
          const dataWithUserId = mockSet.data.map(item => {
            // Remove any fields that don't exist in the target table
            const cleanedItem = { ...item };
            
            // For notes, ensure no unexpected fields
            if (setKey === 'notes') {
              delete cleanedItem.description;
            }
            
            // For meetings, ensure all required fields are present
            if (setKey === 'meetings') {
              // Ensure date is in correct format
              if (cleanedItem.date && typeof cleanedItem.date === 'string') {
                cleanedItem.date = cleanedItem.date.split('T')[0]; // Extract date part only
              }
            }
            
            return {
              ...cleanedItem,
              user_id: user.id
            };
          });

          // Handle different table inserts based on set type
          let result;
          
          switch (setKey) {
            case 'notes':
              result = await supabase.from('notes').insert(dataWithUserId);
              break;
            case 'meetings':
              result = await supabase.from('meetings').insert(dataWithUserId);
              break;
            case 'supplies':
              result = await supabase.from('supplies').insert(dataWithUserId);
              break;
            case 'expenses':
              result = await supabase.from('expenses').insert(dataWithUserId);
              break;
            case 'planningEvents':
              result = await supabase.from('planning_events').insert(dataWithUserId);
              break;
            case 'futureTasksAndPlanning':
              result = await supabase.from('future_planning').insert(dataWithUserId);
              break;
            case 'feedback':
              result = await supabase.from('feedback').insert(dataWithUserId);
              break;
            default:
              throw new Error(`Unknown data set: ${setKey}`);
          }

          if (result.error) {
            throw result.error;
          }

          results[setKey] = { success: true, count: dataWithUserId.length };
          
          // Invalidate relevant queries based on set type
          switch (setKey) {
            case 'notes':
              queryClient.invalidateQueries({ queryKey: ['notes'] });
              break;
            case 'meetings':
              queryClient.invalidateQueries({ queryKey: ['meetings'] });
              break;
            case 'supplies':
              queryClient.invalidateQueries({ queryKey: ['supplies'] });
              break;
            case 'expenses':
              queryClient.invalidateQueries({ queryKey: ['expenses'] });
              break;
            case 'planningEvents':
              queryClient.invalidateQueries({ queryKey: ['planning_events'] });
              break;
            case 'futureTasksAndPlanning':
              queryClient.invalidateQueries({ queryKey: ['future_planning'] });
              break;
            case 'feedback':
              queryClient.invalidateQueries({ queryKey: ['feedback'] });
              break;
          }
          
        } catch (error: any) {
          console.error(`Error seeding ${setKey}:`, error);
          results[setKey] = { success: false, count: 0, error: error.message };
        }

        completedSets++;
        setProgress((completedSets / totalSets) * 100);
        setSeedResults(results);
      }

      setCurrentSet("");

      // Create a custom event for other components
      const seedDataEvent = new CustomEvent('seedDataCompleted', { detail: { userId: user.id, results } });
      window.dispatchEvent(seedDataEvent);

      const successCount = Object.values(results).filter(r => r.success).length;
      const failureCount = Object.values(results).filter(r => !r.success).length;

      toast({
        title: "Seed operation completed",
        description: `Successfully seeded ${successCount} data sets${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
        variant: successCount > 0 ? "default" : "destructive"
      });

    } catch (error: any) {
      console.error("Error during seeding:", error);
      toast({
        title: "Seeding failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Admin Seed Data Manager
        </CardTitle>
        <CardDescription>
          Comprehensive mock data generation for testing platform functionality and ensuring data integrity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This tool generates realistic test data to help validate platform functionality, test edge cases, and ensure proper data flow across all features.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Select Data Sets</h4>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={selectAllSets}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={resetResults}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Results
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(mockDataSets).map(([key, set]) => (
              <div
                key={key}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedSets.includes(key) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleSetSelection(key, !selectedSets.includes(key))}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox 
                        checked={selectedSets.includes(key)}
                        onChange={() => {}}
                      />
                      <h5 className="font-medium text-sm">{set.name}</h5>
                      <Badge variant="secondary" className="text-xs">
                        {set.count} items
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {set.description}
                    </p>
                    {seedResults[key] && (
                      <div className="flex items-center gap-2">
                        {seedResults[key].success ? (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Success ({seedResults[key].count} items)
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Failed: {seedResults[key].error}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {(isSeeding || isDeleting) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentSet}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <Database className="h-4 w-4 mr-2" />
                Preview Data Structure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Mock Data Preview</DialogTitle>
                <DialogDescription>
                  Preview of the data structure that will be generated
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {Object.entries(mockDataSets).map(([key, set]) => (
                  <div key={key} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{set.name}</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                      {JSON.stringify(set.data[0], null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            onClick={seedSelectedData} 
            disabled={isSeeding || isDeleting || selectedSets.length === 0 || !user}
            className="flex-1"
          >
            {isSeeding ? (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Seeding Data...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Seed Selected Data ({selectedSets.length})
              </>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                disabled={isSeeding || isDeleting || selectedSets.length === 0 || !user}
                className="flex-1"
              >
                {isDeleting ? (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Deleting Data...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected Data ({selectedSets.length})
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Mock Data</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>all your data</strong> from the selected tables ({selectedSets.length} selected). This only affects your admin account and will not touch any other user's data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteSelectedData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Delete All Selected Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
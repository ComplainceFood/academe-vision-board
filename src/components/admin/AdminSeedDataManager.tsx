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
import { Database, TestTube, RotateCcw, Zap, Info, CheckCircle } from "lucide-react";

// Enhanced mock data sets
const mockDataSets = {
  notes: {
    name: "Academic Notes & Commitments",
    description: "Various types of notes including commitments, research notes, and course materials",
    count: 15,
    data: [
      {
        title: "Project Extension",
        content: "Promised 2-week extension for final project to CS101 students who attended workshop.",
        type: "commitment",
        course: "CS101",
        tags: ["extension", "project"],
        starred: true
      },
      {
        title: "Lab Equipment Order",
        content: "Need to order 5 more Raspberry Pi kits for the robotics lab by next Monday.",
        type: "note",
        course: "CS202",
        tags: ["supplies", "lab"]
      },
      {
        title: "Research Paper Draft",
        content: "Review draft on machine learning applications in education - due next week.",
        type: "commitment",
        course: "Research",
        tags: ["research", "paper", "ml"],
        student: "Dr. Jane Smith"
      },
      {
        title: "Guest Lecture Planning",
        content: "Arrange guest speaker for advanced algorithms class - contact industry professional.",
        type: "note",
        course: "CS301",
        tags: ["guest", "lecture", "industry"]
      },
      {
        title: "Student Conference Support",
        content: "Committed to provide funding support for 3 students to attend conference.",
        type: "commitment",
        course: "Research",
        tags: ["conference", "funding", "students"],
        starred: true
      }
    ]
  },
  meetings: {
    name: "Academic Meetings",
    description: "Various types of meetings including 1:1s, committee meetings, and office hours",
    count: 12,
    data: [
      {
        title: "Academic Advisory Meeting",
        type: "1:1",
        status: "scheduled",
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: "10:00 AM",
        duration: "30 min",
        attendees: ["John Smith"],
        location: "Office 302"
      },
      {
        title: "Department Committee",
        type: "committee",
        status: "scheduled",
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: "2:00 PM",
        duration: "90 min",
        attendees: ["Dr. Brown", "Dr. Davis", "Dr. Wilson"],
        location: "Conference Room A"
      },
      {
        title: "Research Progress Review",
        type: "1:1",
        status: "completed",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: "11:30 AM",
        duration: "45 min",
        attendees: ["Emily Johnson"],
        location: "Lab 204",
        notes: "Discussed thesis progress. Emily has completed chapter 2 and is working on experimental design.",
        action_items: [
          "Provide feedback on methodology section",
          "Schedule equipment training session",
          "Review literature recommendations"
        ]
      }
    ]
  },
  supplies: {
    name: "Laboratory & Office Supplies",
    description: "Equipment, materials, and supplies for courses and research",
    count: 20,
    data: [
      {
        name: "Whiteboard Markers",
        category: "Office Supplies",
        course: "All Courses",
        current_count: 12,
        total_count: 50,
        threshold: 10,
        cost: 2.99,
        last_restocked: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        name: "Raspberry Pi Kits",
        category: "Lab Equipment",
        course: "CS202",
        current_count: 8,
        total_count: 15,
        threshold: 5,
        cost: 65.00,
        last_restocked: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        name: "Arduino Boards",
        category: "Lab Equipment",
        course: "CS202",
        current_count: 3,
        total_count: 10,
        threshold: 5,
        cost: 24.99,
        last_restocked: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]
  },
  expenses: {
    name: "Academic Expenses",
    description: "Course materials, equipment, and professional development expenses",
    count: 18,
    data: [
      {
        description: "Conference Registration Fee",
        amount: 299.99,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: "Professional Development",
        course: "CS404",
        receipt: true
      },
      {
        description: "Lab Equipment Replacement",
        amount: 412.87,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: "Equipment",
        course: "CS202",
        receipt: true
      },
      {
        description: "Reference Books",
        amount: 156.45,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: "Materials",
        course: "CS101",
        receipt: true
      }
    ]
  },
  planningEvents: {
    name: "Planning Events",
    description: "Academic calendar events and planning items",
    count: 10,
    data: [
      {
        title: "Midterm Exam Preparation",
        type: "academic",
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: "14:00",
        end_time: "16:00",
        course: "CS101",
        priority: "high",
        location: "Lecture Hall A"
      },
      {
        title: "Final Project Presentations",
        type: "academic",
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: "09:00",
        end_time: "17:00",
        course: "CS301",
        priority: "high",
        location: "Multiple Rooms"
      }
    ]
  },
  futureTasksAndPlanning: {
    name: "Future Tasks & Planning",
    description: "Long-term planning items and future semester preparation",
    count: 8,
    data: [
      {
        title: "Curriculum Update for Fall Semester",
        semester: "Fall 2025",
        priority: "high",
        estimated_hours: 40
      },
      {
        title: "Lab Equipment Modernization",
        semester: "Summer 2025",
        priority: "medium",
        estimated_hours: 20
      }
    ]
  },
  feedback: {
    name: "Platform Feedback",
    description: "Sample feedback submissions for testing the feedback system",
    count: 6,
    data: [
      {
        category: "notes",
        subject: "Improve note organization",
        description: "It would be great to have better tagging and filtering options for notes. Currently it's hard to find specific notes when you have many.",
        priority: "medium",
        status: "in_progress",
        admin_response: "Thank you for this suggestion! We're currently working on enhanced filtering and tagging features that should be available in the next update."
      },
      {
        category: "supplies",
        subject: "Low stock notifications",
        description: "The low stock alerts don't seem to be working properly. I didn't get notified when my supplies went below threshold.",
        priority: "high",
        status: "resolved",
        admin_response: "This issue has been identified and fixed. The notification system was not properly checking threshold values. Please test it again and let us know if you still experience issues.",
        resolved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        category: "bug_report",
        subject: "Calendar sync issues",
        description: "The calendar synchronization with Outlook sometimes fails without any error message. Would be helpful to have better error reporting.",
        priority: "urgent",
        status: "open"
      },
      {
        category: "feature_request",
        subject: "Mobile app support",
        description: "A mobile app or responsive mobile interface would be very helpful for accessing the platform on the go.",
        priority: "low",
        status: "open"
      },
      {
        category: "general",
        subject: "Overall great platform",
        description: "I love using this platform for managing my academic work. The interface is clean and intuitive. Keep up the great work!",
        priority: "low",
        status: "closed",
        admin_response: "Thank you so much for the positive feedback! We're glad you're enjoying the platform. Your support motivates us to keep improving."
      },
      {
        category: "analytics",
        subject: "Export functionality needed",
        description: "Would love to be able to export analytics data to Excel or CSV format for external reporting and analysis.",
        priority: "medium",
        status: "open"
      }
    ]
  }
};

export function AdminSeedDataManager() {
  const [isSeeding, setIsSeeding] = useState(false);
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
            
            // For notes and meetings, ensure no unexpected fields
            if (setKey === 'notes' || setKey === 'meetings') {
              // Remove any description field that might exist
              delete cleanedItem.description;
            }
            
            // For planning events, remove description field
            if (setKey === 'planningEvents') {
              delete cleanedItem.description;
            }
            
            // For future planning, remove description field since it doesn't exist in schema
            if (setKey === 'futureTasksAndPlanning') {
              delete cleanedItem.description;
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

        {isSeeding && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {currentSet}</span>
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
            disabled={isSeeding || selectedSets.length === 0 || !user}
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
        </div>
      </CardContent>
    </Card>
  );
}
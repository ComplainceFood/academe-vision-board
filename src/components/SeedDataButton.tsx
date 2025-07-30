
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";

// Mock data definitions are kept the same
const mockNotes = [
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
    title: "Midterm Format Change",
    content: "Agreed to change midterm format to include more practical problems after student feedback.",
    type: "commitment",
    course: "CS101",
    tags: ["exam", "format"]
  },
  {
    title: "Research Mentoring",
    content: "Promised to review Jane Smith's research proposal by this Friday.",
    type: "commitment",
    course: "Research",
    tags: ["research", "mentoring"],
    student: "Jane Smith"
  },
  {
    title: "Lab Access",
    content: "Need to arrange extended lab access hours for senior project teams.",
    type: "note",
    course: "CS404",
    tags: ["lab", "access"]
  },
  {
    title: "Lecture Recording",
    content: "Promised to post recording of today's lecture due to technical issues during class.",
    type: "commitment",
    course: "CS202",
    tags: ["lecture", "recording"],
    starred: true
  },
  {
    title: "Office Hours Extension",
    content: "Agreed to additional office hours before final project deadline.",
    type: "commitment",
    course: "CS101",
    tags: ["office hours"]
  }
];

const mockMeetings = [
  {
    title: "Academic Advisory Meeting",
    type: "1:1",
    status: "scheduled",
    date: "2025-04-28",
    time: "10:00 AM",
    duration: "30 min",
    attendees: ["John Smith"],
    location: "Office 302"
  },
  {
    title: "Project Guidance",
    type: "1:1",
    status: "scheduled",
    date: "2025-04-27",
    time: "2:00 PM",
    duration: "45 min",
    attendees: ["Emily Johnson"],
    location: "Online (Zoom)"
  },
  {
    title: "Research Discussion",
    type: "1:1",
    status: "completed",
    date: "2025-04-20",
    time: "11:30 AM",
    duration: "60 min",
    attendees: ["Michael Brown"],
    location: "Lab 204",
    notes: "Discussed progress on the machine learning project. Michael has made significant progress on the data preprocessing steps.",
    action_items: [
      "Share research papers on neural networks by email",
      "Provide access to the department GPU server",
      "Schedule follow-up meeting next week"
    ]
  },
  {
    title: "Grade Review",
    type: "1:1",
    status: "completed",
    date: "2025-04-18",
    time: "9:15 AM",
    duration: "15 min",
    attendees: ["Sarah Davis"],
    location: "Office 302",
    notes: "Reviewed midterm exam results. Sarah had questions about the algorithm complexity question.",
    action_items: [
      "Provide additional practice problems",
      "Review concepts during next lecture"
    ]
  },
  {
    title: "Career Advising",
    type: "1:1",
    status: "scheduled",
    date: "2025-04-30",
    time: "3:30 PM",
    duration: "45 min",
    attendees: ["David Wilson"],
    location: "Office 302"
  }
];

const mockSupplies = [
  {
    name: "Whiteboard Markers",
    category: "Office Supplies",
    course: "All Courses",
    current_count: 12,
    total_count: 50,
    threshold: 10,
    cost: 2.99,
    last_restocked: "2025-03-15"
  },
  {
    name: "Raspberry Pi Kits",
    category: "Lab Equipment",
    course: "CS202",
    current_count: 8,
    total_count: 15,
    threshold: 5,
    cost: 65.00,
    last_restocked: "2025-01-20"
  },
  {
    name: "USB Flash Drives",
    category: "Lab Equipment",
    course: "CS101",
    current_count: 24,
    total_count: 40,
    threshold: 15,
    cost: 12.50,
    last_restocked: "2025-02-10"
  },
  {
    name: "Lab Manuals",
    category: "Books",
    course: "PHYS304",
    current_count: 18,
    total_count: 30,
    threshold: 10,
    cost: 24.99,
    last_restocked: "2025-03-01"
  },
  {
    name: "Graph Paper Notepads",
    category: "Office Supplies",
    course: "MATH201",
    current_count: 20,
    total_count: 50,
    threshold: 15,
    cost: 3.49,
    last_restocked: "2025-03-25"
  }
];

const mockExpenses = [
  {
    description: "Conference Registration Fee",
    amount: 299.99,
    date: "2025-03-20",
    category: "Professional Development",
    course: "CS404",
    receipt: true
  },
  {
    description: "Lab Equipment Replacement",
    amount: 412.87,
    date: "2025-03-15",
    category: "Equipment",
    course: "CS202",
    receipt: true
  },
  {
    description: "Reference Books",
    amount: 156.45,
    date: "2025-04-02",
    category: "Materials",
    course: "CS101",
    receipt: true
  },
  {
    description: "Workshop Refreshments",
    amount: 87.50,
    date: "2025-04-10",
    category: "Events",
    course: "CS101",
    receipt: false
  },
  {
    description: "Printer Ink Cartridges",
    amount: 64.99,
    date: "2025-03-28",
    category: "Office Supplies",
    course: "All Courses",
    receipt: true
  }
];

export function SeedDataButton() {
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSystemAdmin, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();

  // Only show seed button to system admin users
  if (roleLoading || !isSystemAdmin()) {
    return null;
  }

  async function seedMockData() {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to seed data",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSeeding(true);
      
      // Add user_id to each record and current dates
      const notesWithUserId = mockNotes.map(note => ({
        ...note,
        user_id: user.id,
        date: new Date().toISOString()
      }));
      
      const meetingsWithUserId = mockMeetings.map(meeting => ({
        ...meeting,
        user_id: user.id
      }));
      
      const suppliesWithUserId = mockSupplies.map(supply => ({
        ...supply,
        user_id: user.id
      }));
      
      const expensesWithUserId = mockExpenses.map(expense => ({
        ...expense,
        user_id: user.id
      }));
      
      console.log("Seeding mock data with user ID:", user.id);
      
      // Insert data into all tables
      const notePromise = supabase.from('notes').insert(notesWithUserId);
      const meetingPromise = supabase.from('meetings').insert(meetingsWithUserId);
      const supplyPromise = supabase.from('supplies').insert(suppliesWithUserId);
      const expensePromise = supabase.from('expenses').insert(expensesWithUserId);
      
      // Wait for all promises to resolve
      const [notesResult, meetingsResult, suppliesResult, expensesResult] = await Promise.all([
        notePromise, meetingPromise, supplyPromise, expensePromise
      ]);
      
      // Check if any errors occurred
      const errors = [];
      if (notesResult.error) errors.push(`Notes: ${notesResult.error.message}`);
      if (meetingsResult.error) errors.push(`Meetings: ${meetingsResult.error.message}`);
      if (suppliesResult.error) errors.push(`Supplies: ${suppliesResult.error.message}`);
      if (expensesResult.error) errors.push(`Expenses: ${expensesResult.error.message}`);
      
      if (errors.length > 0) {
        throw new Error(`Errors occurred while seeding data: ${errors.join(', ')}`);
      }
      
      // Invalidate queries to refresh UI data across the app
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      
      // Create a custom event that other components can listen for
      const seedDataEvent = new CustomEvent('seedDataCompleted', { detail: { userId: user.id } });
      window.dispatchEvent(seedDataEvent);
      
      toast({
        title: "Success!",
        description: "Mock data has been successfully added to all tables in your account.",
      });
      
      console.log("Successfully seeded mock data!");
    } catch (error) {
      console.error("Error seeding data:", error);
      toast({
        title: "Error seeding data",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  }

  return (
    <Button 
      onClick={seedMockData} 
      disabled={isSeeding || !user}
      className="w-full"
    >
      {isSeeding ? "Seeding Data..." : "Seed Mock Data"}
    </Button>
  );
}

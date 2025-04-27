
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Mock data from the seedMockData.js script
const mockNotes = [
  {
    title: "Project Extension",
    content: "Promised 2-week extension for final project to CS101 students who attended workshop.",
    type: "promise",
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
    type: "promise",
    course: "CS101",
    tags: ["exam", "format"]
  },
  {
    title: "Research Mentoring",
    content: "Promised to review Jane Smith's research proposal by this Friday.",
    type: "promise",
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
    type: "promise",
    course: "CS202",
    tags: ["lecture", "recording"],
    starred: true
  },
  {
    title: "Office Hours Extension",
    content: "Agreed to additional office hours before final project deadline.",
    type: "promise",
    course: "CS101",
    tags: ["office hours"]
  }
];

export function SeedDataButton() {
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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
      
      // Add user_id to each record
      const notesWithUserId = mockNotes.map(note => ({
        ...note,
        user_id: user.id,
        date: new Date().toISOString()
      }));
      
      console.log("Seeding mock data with user ID:", user.id);
      
      // Insert the data
      const { data, error } = await supabase.from('notes').insert(notesWithUserId);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success!",
        description: "Mock data has been successfully added to your account.",
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

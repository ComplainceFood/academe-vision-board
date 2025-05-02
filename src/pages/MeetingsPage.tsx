
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Check, 
  MessageSquare, 
  Search,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  XCircle,
  MoreVertical
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDataFetching } from "@/hooks/useDataFetching";
import { CreateMeetingDialog } from "@/components/meetings/CreateMeetingDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Meeting {
  id: string;
  title: string;
  type: string;
  status: "scheduled" | "completed" | "cancelled";
  date: string;
  time: string;
  duration: string;
  attendees: string[];
  location: string;
  notes?: string;
  action_items?: string[];
}

const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
  const { toast } = useToast();
  
  const statusColors = {
    scheduled: "bg-primary/15 text-primary",
    completed: "bg-secondary/15 text-secondary",
    cancelled: "bg-destructive/15 text-destructive"
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  const handleStatusChange = async (id: string, newStatus: "scheduled" | "completed" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("meetings")
        .update({ status: newStatus })
        .eq("id", id);
        
      if (error) throw error;
      
      toast({
        title: "Status updated",
        description: `Meeting ${newStatus === "completed" ? "marked as complete" : newStatus === "cancelled" ? "cancelled" : "rescheduled"}`,
      });
      
      // Trigger a refresh
      window.dispatchEvent(new Event("seedDataCompleted"));
    } catch (error) {
      console.error("Error updating meeting status:", error);
      toast({
        title: "Error",
        description: "Failed to update meeting status",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="mb-4 glassmorphism">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs ${statusColors[meeting.status]}`}>
                {meeting.status}
              </span>
              <Badge variant="outline">{meeting.type}</Badge>
            </div>
            <CardTitle className="text-lg">{meeting.title}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              {meeting.status !== "completed" && (
                <DropdownMenuItem onClick={() => handleStatusChange(meeting.id, "completed")}>
                  Mark Complete
                </DropdownMenuItem>
              )}
              {meeting.status === "completed" && (
                <DropdownMenuItem onClick={() => handleStatusChange(meeting.id, "scheduled")}>
                  Mark Incomplete
                </DropdownMenuItem>
              )}
              {meeting.status !== "cancelled" && (
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => handleStatusChange(meeting.id, "cancelled")}
                >
                  Cancel
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(meeting.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{meeting.time} ({meeting.duration})</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{meeting.attendees?.join(", ") || "No attendees"}</span>
          </div>
        </div>
        
        {meeting.notes && (
          <div className="mt-4 p-3 bg-muted/50 rounded-md">
            <p className="text-sm mb-2 font-medium">Meeting Notes:</p>
            <p className="text-sm text-muted-foreground">{meeting.notes}</p>
            
            {meeting.action_items && meeting.action_items.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-1">Action Items:</p>
                <ul className="text-sm">
                  {meeting.action_items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 mb-1">
                      <Check className="h-4 w-4 text-secondary mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {meeting.status === "scheduled" && (
        <CardFooter className="pt-0 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">Reschedule</Button>
          <Button size="sm" className="flex-1">Start Meeting</Button>
        </CardFooter>
      )}
    </Card>
  );
};

const MeetingsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");
  
  const { data: meetings = [], isLoading } = useDataFetching<Meeting>({ 
    table: "meetings",
    transform: (meeting) => ({
      ...meeting,
      id: meeting.id,
      attendees: Array.isArray(meeting.attendees) ? meeting.attendees : [],
      action_items: Array.isArray(meeting.action_items) ? meeting.action_items : []
    })
  });

  const filteredMeetings = meetings.filter(meeting => {
    // Filter by search query
    const matchesSearch = 
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (meeting.attendees && meeting.attendees.some(attendee => 
        attendee.toLowerCase().includes(searchQuery.toLowerCase())
      ));
      
    // Filter by tab
    const matchesTab = 
      (activeTab === "upcoming" && meeting.status === "scheduled") ||
      (activeTab === "past" && meeting.status === "completed") ||
      (activeTab === "all");
      
    return matchesSearch && matchesTab;
  });

  // Sort meetings by date
  const sortedMeetings = [...filteredMeetings].sort((a, b) => {
    if (activeTab === "upcoming") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Meetings & 1:1s</h1>
            <p className="text-muted-foreground">Schedule and manage your meetings</p>
          </div>
          <div className="mt-4 md:mt-0">
            <CreateMeetingDialog />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search meetings..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upcoming" className="flex items-center gap-1">
                <ArrowUp className="h-4 w-4" />
                <span>Upcoming</span>
                <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                  {meetings.filter(m => m.status === "scheduled").length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-1">
                <ArrowDown className="h-4 w-4" />
                <span>Past</span>
                <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                  {meetings.filter(m => m.status === "completed").length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>All</span>
                <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                  {meetings.length}
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="mt-4">
              {isLoading ? (
                <div className="text-center py-12">Loading meetings...</div>
              ) : sortedMeetings.length > 0 ? (
                sortedMeetings.map(meeting => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium mb-1">No upcoming meetings</h3>
                  <p className="text-muted-foreground">Schedule a new meeting to get started</p>
                  <CreateMeetingDialog />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="past" className="mt-4">
              {isLoading ? (
                <div className="text-center py-12">Loading meetings...</div>
              ) : sortedMeetings.length > 0 ? (
                sortedMeetings.map(meeting => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))
              ) : (
                <div className="text-center py-12">
                  <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium mb-1">No past meetings</h3>
                  <p className="text-muted-foreground">Past meetings will appear here</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all" className="mt-4">
              {isLoading ? (
                <div className="text-center py-12">Loading meetings...</div>
              ) : sortedMeetings.length > 0 ? (
                sortedMeetings.map(meeting => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium mb-1">No meetings found</h3>
                  <p className="text-muted-foreground">Try adjusting your search</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default MeetingsPage;

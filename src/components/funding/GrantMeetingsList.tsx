import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, FileText, Check, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import { FundingSource } from "@/types/funding";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface GrantMeeting {
  id: string;
  title: string;
  start_date: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  type: string;
  agenda: string | null;
  attendees: any[];
  action_items: any[];
  funding_source_id: string;
}

interface GrantMeetingsListProps {
  sources: FundingSource[];
  isLoading: boolean;
}

export function GrantMeetingsList({ sources, isLoading: sourcesLoading }: GrantMeetingsListProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: grantMeetings = [], isLoading } = useQuery({
    queryKey: ['grant-meetings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .not('funding_source_id', 'is', null)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as GrantMeeting[];
    },
    enabled: !!user,
  });

  const getSourceName = (fundingSourceId: string) => {
    const source = sources.find(s => s.id === fundingSourceId);
    return source ? source.name : 'Unknown Grant';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) return dateString;
      return format(date, 'EEE, MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const statusColors: Record<string, string> = {
    scheduled: "bg-primary/15 text-primary",
    in_progress: "bg-accent/15 text-accent-foreground",
    completed: "bg-secondary/15 text-secondary-foreground",
    cancelled: "bg-destructive/15 text-destructive",
    postponed: "bg-muted text-muted-foreground",
  };

  // Group meetings by funding source
  const grouped = grantMeetings.reduce<Record<string, GrantMeeting[]>>((acc, meeting) => {
    const key = meeting.funding_source_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(meeting);
    return acc;
  }, {});

  if (isLoading || sourcesLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  if (grantMeetings.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Grant Meetings Yet</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            When you schedule a meeting and toggle "Grant Meeting", it will appear here linked to the corresponding grant.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/meetings')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Go to Meetings
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([sourceId, meetings]) => (
        <div key={sourceId} className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Badge variant="outline" className="text-sm font-normal">{getSourceName(sourceId)}</Badge>
            <span className="text-sm text-muted-foreground">{meetings.length} meeting{meetings.length !== 1 ? 's' : ''}</span>
          </h3>
          <div className="grid gap-3">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{meeting.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[meeting.status] || ''}`}>
                          {meeting.status}
                        </span>
                        <Badge variant="outline" className="text-xs">{meeting.type}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(meeting.start_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {meeting.start_time} - {meeting.end_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {meeting.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {meeting.attendees?.length || 0} attendees
                        </span>
                      </div>
                      {meeting.agenda && (
                        <p className="text-sm text-muted-foreground line-clamp-1 flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          {meeting.agenda}
                        </p>
                      )}
                      {meeting.action_items && Array.isArray(meeting.action_items) && meeting.action_items.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Check className="h-3.5 w-3.5" />
                          {meeting.action_items.length} action item{meeting.action_items.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

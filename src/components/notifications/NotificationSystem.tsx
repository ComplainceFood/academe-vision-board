import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Mail, Smartphone, Settings, TestTube, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NotificationPreferences {
  email_notifications: boolean;
  task_reminders: boolean;
  meeting_alerts: boolean;
  low_supply_alerts: boolean;
  funding_alerts: boolean;
  email_frequency: 'immediate' | 'daily' | 'weekly';
  reminder_time: string;
}

export const NotificationSystem = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    task_reminders: true,
    meeting_alerts: true,
    low_supply_alerts: true,
    funding_alerts: true,
    email_frequency: 'daily',
    reminder_time: '09:00',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      // Load from localStorage for now (will be updated once types are refreshed)
      const stored = localStorage.getItem('notification_preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage for now (will be updated once types are refreshed)
      localStorage.setItem('notification_preferences', JSON.stringify(preferences));

      toast({
        title: "Preferences Saved",
        description: "Your notification preferences have been updated",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestNotification = async () => {
    setIsTesting(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'test',
          recipient: user?.email,
          title: 'Test Notification',
          message: 'This is a test email from Academia Vision to confirm your notification settings are working correctly.',
        },
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Test Email Sent! 📧",
        description: "Check your email inbox for the test notification",
      });
    } catch (error) {
      console.error('Test notification error:', error);
      toast({
        title: "Test Failed",
        description: "Failed to send test notification. Check your email settings.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Enhanced Notification System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Configure your notification preferences to stay updated with important activities, deadlines, and system alerts.
            </AlertDescription>
          </Alert>

          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Email Notifications</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Enable Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about important activities
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-frequency">Email Frequency</Label>
                <Select
                  value={preferences.email_frequency}
                  onValueChange={(value) => updatePreference('email_frequency', value)}
                  disabled={!preferences.email_notifications}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Specific Alert Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Alert Types</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="task-reminders">Task Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded about upcoming tasks and deadlines
                  </p>
                </div>
                <Switch
                  id="task-reminders"
                  checked={preferences.task_reminders}
                  onCheckedChange={(checked) => updatePreference('task_reminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="meeting-alerts">Meeting Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications before scheduled meetings
                  </p>
                </div>
                <Switch
                  id="meeting-alerts"
                  checked={preferences.meeting_alerts}
                  onCheckedChange={(checked) => updatePreference('meeting_alerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="low-supply-alerts">Low Supply Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when supplies are running low
                  </p>
                </div>
                <Switch
                  id="low-supply-alerts"
                  checked={preferences.low_supply_alerts}
                  onCheckedChange={(checked) => updatePreference('low_supply_alerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="funding-alerts">Funding Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications about funding deadlines and status
                  </p>
                </div>
                <Switch
                  id="funding-alerts"
                  checked={preferences.funding_alerts}
                  onCheckedChange={(checked) => updatePreference('funding_alerts', checked)}
                />
              </div>
            </div>
          </div>

          {/* Timing Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Timing & Schedule</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reminder-time">Daily Reminder Time</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={preferences.reminder_time}
                  onChange={(e) => updatePreference('reminder_time', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  When to send daily digest emails and reminders
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={savePreferences} disabled={isSaving}>
              <Settings className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={sendTestNotification} 
              disabled={isTesting || !preferences.email_notifications}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTesting ? 'Sending...' : 'Send Test Email'}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <strong>Privacy:</strong> We only send notifications based on your preferences. 
            Your email is never shared with third parties. You can disable all notifications at any time.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
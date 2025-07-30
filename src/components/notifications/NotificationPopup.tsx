import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, ExternalLink, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface NotificationData {
  id: string;
  title: string;
  content: string;
  type: 'communication' | 'system' | 'reminder' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  author?: string;
  created_at: string;
  is_read: boolean;
  action_url?: string;
}

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  notification: NotificationData | null;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  isOpen,
  onClose,
  notification
}) => {
  if (!notification) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'communication': return <Bell className="h-4 w-4" />;
      case 'system': return <ExternalLink className="h-4 w-4" />;
      case 'reminder': return <Clock className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const markAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleClose = () => {
    markAsRead();
    onClose();
  };

  const handleActionClick = () => {
    if (notification.action_url) {
      window.open(notification.action_url, '_blank');
    }
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {getTypeIcon(notification.type)}
              New Notification
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={getPriorityColor(notification.priority) as any}>
                {notification.priority.toUpperCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(notification.created_at).toLocaleString()}
              </span>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">{notification.title}</h3>
              <p className="text-muted-foreground">{notification.content}</p>
            </div>
            
            {notification.author && (
              <div className="text-sm text-muted-foreground">
                From: {notification.author}
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              {notification.action_url && (
                <Button onClick={handleActionClick} className="flex-1">
                  View Details
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              )}
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export const NotificationManager: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as NotificationData;
          setCurrentNotification(newNotification);
          setIsPopupOpen(true);
          setNotifications(prev => [newNotification, ...prev]);
        }
      )
      .subscribe();

    // Load existing unread notifications
    loadUnreadNotifications();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadUnreadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      setNotifications((data || []).map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        type: item.type as 'communication' | 'system' | 'reminder' | 'alert',
        priority: item.priority as 'low' | 'medium' | 'high' | 'urgent',
        author: item.author || undefined,
        created_at: item.created_at,
        is_read: item.is_read,
        action_url: item.action_url || undefined
      })));
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setCurrentNotification(null);
  };

  return (
    <NotificationPopup
      isOpen={isPopupOpen}
      onClose={handleClosePopup}
      notification={currentNotification}
    />
  );
};
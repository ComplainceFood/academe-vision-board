import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AppNotification {
  id: string;
  title: string;
  content: string;
  type: "communication" | "system" | "reminder" | "alert";
  priority: "low" | "medium" | "high" | "urgent";
  author?: string;
  created_at: string;
  is_read: boolean;
  action_url?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(
        (data || []).map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          type: n.type as AppNotification["type"],
          priority: n.priority as AppNotification["priority"],
          author: n.author ?? undefined,
          created_at: n.created_at,
          is_read: n.is_read ?? false,
          action_url: n.action_url ?? undefined,
        }))
      );
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) {
      // Roll back optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
      );
    }
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  }, []);

  // Real-time inserts
  useEffect(() => {
    if (!user) return;

    load();

    const channel = supabase
      .channel(`notifications-bell-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as any;
          setNotifications((prev) => [
            {
              id: n.id,
              title: n.title,
              content: n.content,
              type: n.type,
              priority: n.priority,
              author: n.author ?? undefined,
              created_at: n.created_at,
              is_read: false,
              action_url: n.action_url ?? undefined,
            },
            ...prev,
          ]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as any;
          setNotifications((prev) =>
            prev.map((existing) =>
              existing.id === n.id ? { ...existing, is_read: n.is_read } : existing
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  return { notifications, unreadCount, isLoading, markRead, markAllRead, deleteNotification, reload: load };
}

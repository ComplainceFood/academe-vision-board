import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  bio: string | null;
  avatar_url: string | null;
  office_location: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ 
          user_id: user.id,
          ...updates 
        }, { onConflict: "user_id" });

      if (error) throw error;

      // Immediately update local state before refetching
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      // Also trigger a refetch to ensure consistency
      await fetchProfile();
      
      return { success: true };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { success: false, error };
    }
  };

  return { profile, loading, updateProfile, refetch: fetchProfile };
}
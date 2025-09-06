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
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Enhanced security: Only fetch user's own profile with explicit user_id check
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(); // Use maybeSingle instead of single for better error handling

      if (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
        return;
      }

      // Additional client-side security check
      if (data && data.user_id !== user.id) {
        console.error("Security violation: Profile user_id mismatch");
        setProfile(null);
        return;
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
    if (!user) return { success: false, error: "User not authenticated" };

    try {
      // Security: Ensure user_id cannot be tampered with
      const secureUpdates = { ...updates };
      delete (secureUpdates as any).user_id; // Remove user_id to prevent tampering
      
      // Validate sensitive data before sending to database
      if (secureUpdates.email && !/^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/.test(secureUpdates.email)) {
        return { success: false, error: "Invalid email format" };
      }
      
      if (secureUpdates.display_name && secureUpdates.display_name.length > 255) {
        return { success: false, error: "Display name too long (max 255 characters)" };
      }
      
      if (secureUpdates.bio && secureUpdates.bio.length > 5000) {
        return { success: false, error: "Bio too long (max 5000 characters)" };
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({ 
          user_id: user.id, // Always use authenticated user ID
          ...secureUpdates 
        }, { onConflict: "user_id" });

      if (error) {
        // Log security-related errors
        if (error.message.includes('SECURITY VIOLATION')) {
          console.error('Security violation detected:', error.message);
          return { success: false, error: "Unauthorized operation detected" };
        }
        throw error;
      }

      // Immediately update local state
      setProfile(prev => prev ? { ...prev, ...secureUpdates } : null);
      
      return { success: true };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { success: false, error };
    }
  };

  return { profile, loading, updateProfile, refetch: fetchProfile };
}
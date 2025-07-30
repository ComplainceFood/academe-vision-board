import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type UserRole = 'admin' | 'moderator' | 'user' | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // First check if user has any role assigned
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('role', { ascending: true }) // admin first, then moderator, then user
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('Error fetching user role:', error);
          setRole('user'); // Default to user role
        } else if (roleData) {
          setRole(roleData.role as UserRole);
        } else {
          // No role assigned, assign default user role
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'user'
            });

          if (insertError) {
            console.error('Error assigning default role:', insertError);
          }
          setRole('user');
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setRole('user'); // Default fallback
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user]);

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!role || !requiredRole) return false;
    
    const roleHierarchy = { admin: 3, moderator: 2, user: 1 };
    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  const isAdmin = (): boolean => role === 'admin';
  const isModerator = (): boolean => role === 'moderator' || role === 'admin';

  return {
    role,
    loading,
    hasRole,
    isAdmin,
    isModerator,
  };
}
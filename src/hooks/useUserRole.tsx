import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type UserRole = 'system_admin' | 'primary_user' | 'secondary_user' | null;

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
        // Check if user has any role assigned
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('role', { ascending: true }) // system_admin first, then primary_user, then secondary_user
          .limit(1)
          .maybeSingle(); // Use maybeSingle to avoid errors when no data found

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('primary_user'); // Default to primary_user role
        } else if (roleData) {
          setRole(roleData.role as UserRole);
        } else {
          // No role assigned - user will get a role assigned by trigger when they were created
          // If somehow they don't have a role, default to primary_user
          setRole('primary_user');
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setRole('primary_user'); // Default fallback
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user]);

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!role || !requiredRole) return false;
    
    const roleHierarchy = { system_admin: 3, primary_user: 2, secondary_user: 1 };
    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  const isSystemAdmin = (): boolean => role === 'system_admin';
  const isPrimaryUser = (): boolean => role === 'primary_user' || role === 'system_admin';
  const isSecondaryUser = (): boolean => role === 'secondary_user' || role === 'primary_user' || role === 'system_admin';

  return {
    role,
    loading,
    hasRole,
    isSystemAdmin,
    isPrimaryUser,
    isSecondaryUser,
    // Backward compatibility aliases
    isAdmin: isSystemAdmin,
    isModerator: isPrimaryUser,
  };
}
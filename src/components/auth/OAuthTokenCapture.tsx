import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Globally captures OAuth provider tokens right after sign-in
// and persists them to the relevant integration tables.
// Currently supports Google Calendar.
export const OAuthTokenCapture = () => {
  const { session, user } = useAuth();
  const { toast } = useToast();
  const savedRef = useRef(false);

  useEffect(() => {
    if (!session || !user || savedRef.current) return;

    // Only act immediately after an OAuth sign-in where provider tokens are present
    const anySession: any = session as any;
    const provider = anySession?.user?.app_metadata?.provider;
    const providerToken: string | null = anySession?.provider_token ?? null;
    const providerRefreshToken: string | null = anySession?.provider_refresh_token ?? null;

    if (provider === "google" && providerToken) {
      savedRef.current = true; // prevent duplicate writes on rerenders

      // See if we initiated a linking flow from an existing signed-in user
      let original: any = null;
      try {
        const raw = localStorage.getItem('sp_original_session');
        original = raw ? JSON.parse(raw) : null;
      } catch {}

      const targetUserId = original?.user_id || user.id;

      (async () => {
        try {
          const { error } = await supabase
            .from("google_calendar_integration")
            .upsert(
              {
                user_id: targetUserId,
                access_token: providerToken,
                refresh_token: providerRefreshToken || null,
                is_active: true,
                updated_at: new Date().toISOString(),
                last_sync: null,
              } as any,
              { 
                onConflict: "user_id",
                ignoreDuplicates: false
              }
            );

          if (!error) {
            // If the OAuth flow switched us to the Google user, restore the original session
            if (original && targetUserId !== user.id && original.access_token && original.refresh_token) {
              try {
                await supabase.auth.setSession({
                  access_token: original.access_token,
                  refresh_token: original.refresh_token,
                });
              } catch (err) {
                console.error('Failed to restore original session', err);
              }
            }

            // Notify main window and cleanup
            try {
              localStorage.setItem('sp_google_link_done', '1');
              localStorage.removeItem('sp_original_session');
            } catch {}

            toast({
              title: "Google connected",
              description: "Calendar access granted. You can now sync.",
            });

            // Close popup if this runs inside it
            if (window.opener && !window.opener.closed) {
              window.close();
            }
          }
        } catch (e) {
          console.error("Failed to persist Google tokens", e);
        }
      })();
    }
  }, [session, user]);

  return null;
};

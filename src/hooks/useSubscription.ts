/**
 * useSubscription — single source of truth for the current user's subscription tier.
 *
 * Today:  reads from `user_subscriptions` table (admin-managed).
 * Stripe: when Stripe is integrated, the webhook handler (edge function) should
 *         upsert this same table on checkout.session.completed and
 *         customer.subscription.updated / deleted events. No frontend changes needed.
 *
 * Tier hierarchy:  free < pro < enterprise
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { SubscriptionTier } from "./useFeatureFlags";

export interface Subscription {
  tier: SubscriptionTier;
  status: "active" | "suspended" | "expired" | "trial" | string;
  started_at: string | null;
  expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

const DEFAULT_SUB: Subscription = {
  tier: "free",
  status: "active",
  started_at: null,
  expires_at: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
};

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription>(DEFAULT_SUB);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(DEFAULT_SUB);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("tier, status, started_at, expires_at, stripe_customer_id, stripe_subscription_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("useSubscription fetch error:", error);
        setSubscription(DEFAULT_SUB);
        return;
      }

      if (!data) {
        setSubscription(DEFAULT_SUB);
        return;
      }

      // Treat expired subscriptions as free regardless of stored tier
      const isExpired =
        data.status === "expired" ||
        data.status === "suspended" ||
        (data.expires_at && new Date(data.expires_at) < new Date());

      setSubscription({
        tier: isExpired ? "free" : (data.tier as SubscriptionTier) ?? "free",
        status: data.status ?? "active",
        started_at: data.started_at ?? null,
        expires_at: data.expires_at ?? null,
        stripe_customer_id: data.stripe_customer_id ?? null,
        stripe_subscription_id: data.stripe_subscription_id ?? null,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Realtime subscription updates — when Stripe webhook updates the row, the UI
  // will reflect the new tier automatically without a page reload.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`subscription-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchSubscription]);

  const isPro = subscription.tier === "pro" || subscription.tier === "enterprise";
  const isEnterprise = subscription.tier === "enterprise";
  const isTrial = subscription.status === "trial";

  return { subscription, loading, isPro, isEnterprise, isTrial, refresh: fetchSubscription };
}

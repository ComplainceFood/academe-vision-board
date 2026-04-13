import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

const ALLOWED_ORIGINS = [
  'https://smartprof.app',
  'https://www.smartprof.app',
  'https://64d94714-e892-42c9-981a-bb6f485a7ae3.lovableproject.com',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Require a valid JWT - extract userId from token, never from user-controlled input
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // userId is always from the verified JWT - never from state param
    const userId = user.id;

    const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID');
    const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET');

    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Microsoft credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { code, redirectUri } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Authorization code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate redirectUri against allowlist - never trust arbitrary client-supplied origins
    const origin = req.headers.get('origin') || '';
    const expectedRedirectUri = `${origin}/auth/outlook/callback`;
    const safeRedirectUri = ALLOWED_ORIGINS.some(o => redirectUri?.startsWith(o))
      ? redirectUri
      : expectedRedirectUri;

    const tokenParams = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: safeRedirectUri,
      scope: 'https://graph.microsoft.com/calendars.readwrite https://graph.microsoft.com/user.read offline_access'
    });

    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      // Do not expose Microsoft's error response to the client
      console.error('Token exchange failed with status:', tokenResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to exchange authorization code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenData: TokenResponse = await tokenResponse.json();

    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({ error: 'No access token received' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    // Use service role client to write tokens - scoped to the authenticated user's ID only
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { error: upsertError } = await adminClient
      .from('outlook_integration')
      .upsert({
        user_id: userId,
        access_token_encrypted: tokenData.access_token,
        refresh_token_encrypted: tokenData.refresh_token,
        token_expires_at: expiresAt,
        is_connected: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Database upsert failed:', upsertError.code);
      return new Response(
        JSON.stringify({ error: 'Failed to store integration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, expiresAt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in outlook-oauth-exchange');
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

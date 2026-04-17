import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ALLOWED_ORIGINS = [
  'https://smart-prof.us',
  'https://www.smart-prof.us',
  'http://localhost:5173',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID');

    if (!MICROSOFT_CLIENT_ID) {
      console.error('Missing MICROSOFT_CLIENT_ID secret');
      return new Response(
        JSON.stringify({ error: 'Microsoft credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build redirect URI from allowlist - never from user-controlled headers
    const safeOrigin = ALLOWED_ORIGINS.includes(origin || '') ? origin : ALLOWED_ORIGINS[0];
    const redirectUri = `${safeOrigin}/auth/outlook/callback`;

    const config = {
      clientId: MICROSOFT_CLIENT_ID,
      tenantId: 'common',
      scopes: [
        'https://graph.microsoft.com/calendars.readwrite',
        'https://graph.microsoft.com/user.read',
        'offline_access'
      ],
      redirectUri,
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
    };

    return new Response(
      JSON.stringify(config),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in outlook-oauth-config');
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

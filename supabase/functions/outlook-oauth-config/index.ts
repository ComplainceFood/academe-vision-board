import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID');
    const MICROSOFT_TENANT_ID = Deno.env.get('MICROSOFT_TENANT_ID');
    
    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_TENANT_ID) {
      return new Response(
        JSON.stringify({ 
          error: 'Microsoft credentials not configured',
          details: 'MICROSOFT_CLIENT_ID and MICROSOFT_TENANT_ID must be set'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Use the current Lovable project domain for the redirect URI
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('') || 'https://64d94714-e892-42c9-981a-bb6f485a7ae3.lovableproject.com';
    const redirectUri = `${origin}/auth/outlook/callback`;
    
    console.log('🔧 OAuth Config Debug:', {
      requestOrigin: req.headers.get('origin'),
      referer: req.headers.get('referer'),
      calculatedOrigin: origin,
      redirectUri: redirectUri,
      tenantId: MICROSOFT_TENANT_ID,
      hasClientId: !!MICROSOFT_CLIENT_ID
    });

    // Return the OAuth configuration with multi-tenant support
    const config = {
      clientId: MICROSOFT_CLIENT_ID,
      tenantId: 'common', // Use 'common' for multi-tenant support
      scopes: [
        'https://graph.microsoft.com/calendars.readwrite',
        'https://graph.microsoft.com/user.read',
        'offline_access'
      ],
      redirectUri: redirectUri,
      authUrl: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`,
      tokenUrl: `https://login.microsoftonline.com/common/oauth2/v2.0/token`
    };

    return new Response(
      JSON.stringify(config),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in outlook-oauth-config:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
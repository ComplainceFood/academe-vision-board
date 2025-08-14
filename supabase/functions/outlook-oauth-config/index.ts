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

    // Return the OAuth configuration
    const config = {
      clientId: MICROSOFT_CLIENT_ID,
      tenantId: MICROSOFT_TENANT_ID,
      scopes: [
        'https://graph.microsoft.com/calendars.readwrite',
        'https://graph.microsoft.com/user.read',
        'offline_access'
      ],
      redirectUri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/outlook-oauth-exchange`,
      authUrl: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize`,
      tokenUrl: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`
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
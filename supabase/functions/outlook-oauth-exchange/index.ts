import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

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
    console.log('Starting Outlook OAuth exchange process...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID');
    const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const MICROSOFT_TENANT_ID = Deno.env.get('MICROSOFT_TENANT_ID');

    console.log('Checking Microsoft credentials...', { 
      hasClientId: !!MICROSOFT_CLIENT_ID, 
      hasClientSecret: !!MICROSOFT_CLIENT_SECRET, 
      hasTenantId: !!MICROSOFT_TENANT_ID 
    });

    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET || !MICROSOFT_TENANT_ID) {
      console.error('Missing Microsoft credentials');
      return new Response(
        JSON.stringify({ error: 'Microsoft credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle both GET (redirect callback) and POST requests
    let code: string;
    let state: string;
    
    if (req.method === 'GET') {
      // OAuth callback comes as GET request with query parameters
      const url = new URL(req.url);
      code = url.searchParams.get('code') || '';
      state = url.searchParams.get('state') || '';
    } else {
      // POST request with JSON body
      const body = await req.json();
      code = body.code;
      state = body.state;
    }
    
    console.log('Processing OAuth parameters...', { 
      hasCode: !!code, 
      hasState: !!state,
      method: req.method 
    });

    if (!code) {
      console.error('Missing authorization code');
      return new Response(
        JSON.stringify({ error: 'Authorization code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user_id from state parameter
    const userId = state;
    
    if (!userId) {
      console.error('Missing user ID in state parameter');
      return new Response(
        JSON.stringify({ error: 'User ID is required in state parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exchange authorization code for access token
    const tokenUrl = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;
    // Use the same redirect URI as configured in oauth-config
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('') || '';
    const redirectUri = `${origin}/auth/outlook/callback`;

    const tokenParams = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      scope: 'https://graph.microsoft.com/calendars.readwrite https://graph.microsoft.com/user.read offline_access'
    });

    console.log('Exchanging authorization code for tokens...', { tokenUrl, redirectUri });
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', { 
        status: tokenResponse.status, 
        statusText: tokenResponse.statusText, 
        error: errorText 
      });
      return new Response(
        JSON.stringify({ error: 'Failed to exchange authorization code', details: errorText }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenData: any = await tokenResponse.json();
    
    // 🔍 CRITICAL: Validate token response structure
    console.log('✅ Token exchange successful! Full response structure:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      hasIdToken: !!tokenData.id_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      allKeys: Object.keys(tokenData)
    });

    // 🚨 CRITICAL: Ensure we're using the correct access token, not id_token!
    const actualAccessToken = tokenData.access_token;
    const actualRefreshToken = tokenData.refresh_token;
    
    if (!actualAccessToken) {
      console.error('❌ CRITICAL: No access_token in Microsoft response!', tokenData);
      return new Response(
        JSON.stringify({ error: 'No access token received from Microsoft' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔍 Validate token format (access tokens should NOT be JWTs for Graph API)
    if (actualAccessToken.startsWith('eyJ')) {
      console.error('❌ WARNING: Received JWT-formatted access token, this may be incorrect!');
      console.error('Token preview:', actualAccessToken.substring(0, 50));
    } else {
      console.log('✅ Access token format appears correct (not JWT)');
      console.log('Token preview:', actualAccessToken.substring(0, 20) + '...');
    }

    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();
    console.log('🕒 Token expiration calculated:', { expiresAt, expiresInSeconds: tokenData.expires_in });

    // 🔍 DEBUGGING: Check current database state before upsert
    console.log('🔍 Checking current database state...');
    const { data: currentIntegration, error: checkError } = await supabase
      .from('outlook_integration')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.log('❌ Error checking current state:', checkError.message);
    } else {
      console.log('📊 Current integration state:', {
        exists: !!currentIntegration,
        isConnected: currentIntegration?.is_connected,
        hasAccessToken: !!currentIntegration?.access_token_encrypted,
        hasRefreshToken: !!currentIntegration?.refresh_token_encrypted,
        tokenExpiresAt: currentIntegration?.token_expires_at
      });
    }

    // Prepare upsert data with validated tokens
    const upsertData = {
      user_id: userId,
      access_token_encrypted: actualAccessToken,
      refresh_token_encrypted: actualRefreshToken,
      token_expires_at: expiresAt,
      is_connected: true,
      updated_at: new Date().toISOString()
    };

    console.log('💾 Attempting database upsert with data:', {
      userId: upsertData.user_id,
      hasAccessToken: !!upsertData.access_token_encrypted,
      hasRefreshToken: !!upsertData.refresh_token_encrypted,
      tokenExpiresAt: upsertData.token_expires_at,
      isConnected: upsertData.is_connected,
      updatedAt: upsertData.updated_at
    });

    // Store tokens in the database
    const { data: upsertResult, error: upsertError } = await supabase
      .from('outlook_integration')
      .upsert(upsertData, {
        onConflict: 'user_id'
      })
      .select('*');

    if (upsertError) {
      console.error('❌ Database upsert failed:', {
        error: upsertError,
        errorMessage: upsertError.message,
        errorCode: upsertError.code,
        errorDetails: upsertError.details,
        userId,
        tableName: 'outlook_integration'
      });
      return new Response(
        JSON.stringify({ error: 'Failed to store tokens', details: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Database upsert successful! Result:', {
      rowsAffected: upsertResult?.length || 0,
      resultData: upsertResult?.[0] ? {
        id: upsertResult[0].id,
        userId: upsertResult[0].user_id,
        isConnected: upsertResult[0].is_connected,
        hasAccessToken: !!upsertResult[0].access_token_encrypted,
        hasRefreshToken: !!upsertResult[0].refresh_token_encrypted,
        tokenExpiresAt: upsertResult[0].token_expires_at
      } : 'No result data'
    });

    // 🔍 DEBUGGING: Verify the data was stored correctly
    console.log('🔍 Verifying data storage...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('outlook_integration')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Verification successful! Stored data:', {
        id: verifyData?.id,
        userId: verifyData?.user_id,
        isConnected: verifyData?.is_connected,
        tokenPreview: verifyData?.access_token_encrypted ? `${verifyData.access_token_encrypted.substring(0, 10)}...` : 'N/A',
        refreshPreview: verifyData?.refresh_token_encrypted ? `${verifyData.refresh_token_encrypted.substring(0, 10)}...` : 'N/A',
        tokenExpiresAt: verifyData?.token_expires_at,
        lastSync: verifyData?.last_sync,
        createdAt: verifyData?.created_at,
        updatedAt: verifyData?.updated_at
      });
    }

    console.log('🎉 Outlook integration setup completed successfully for user:', userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Outlook integration connected successfully',
        expiresAt: expiresAt 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in outlook-oauth-exchange:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the authorization header to verify the user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify identity
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user from the token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for inserting login history
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional login method
    let loginMethod = 'password';
    try {
      const body = await req.json();
      if (body.loginMethod && typeof body.loginMethod === 'string') {
        // Sanitize login method - only allow specific values
        const allowedMethods = ['password', 'oauth', 'magic_link', 'otp'];
        loginMethod = allowedMethods.includes(body.loginMethod) ? body.loginMethod : 'password';
      }
    } catch {
      // Body parsing failed, use default
    }

    // Get IP address from request headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    let rawIp = forwardedFor?.split(',')[0].trim() || realIp || '127.0.0.1';
    
    // Validate and sanitize IP address for inet type
    // Remove any port numbers (e.g., "192.168.1.1:8080" -> "192.168.1.1")
    rawIp = rawIp.split(':').length === 2 ? rawIp.split(':')[0] : rawIp;
    
    // Handle IPv6 addresses (remove brackets if present)
    if (rawIp.startsWith('[')) {
      rawIp = rawIp.replace(/^\[|\]$/g, '');
    }
    
    // Validate IP format - use fallback if invalid
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^::1$/;
    
    const ipAddress = (ipv4Regex.test(rawIp) || ipv6Regex.test(rawIp)) ? rawIp : '127.0.0.1';

    // Get user agent
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // Get location data from IP using ipapi.co (free tier: 1000 req/day)
    let locationData = {};
    try {
      // Skip location lookup for localhost/private IPs
      if (!ipAddress.startsWith('127.') && !ipAddress.startsWith('192.168.') && !ipAddress.startsWith('10.') && ipAddress !== '0.0.0.0') {
        const locationResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
        if (locationResponse.ok) {
          const locationJson = await locationResponse.json();
          locationData = {
            city: locationJson.city,
            region: locationJson.region,
            country: locationJson.country_name,
            country_code: locationJson.country_code,
            latitude: locationJson.latitude,
            longitude: locationJson.longitude,
            timezone: locationJson.timezone,
            postal: locationJson.postal,
          };
        }
      }
    } catch (error) {
      console.error('Error fetching location data:', error);
      // Continue without location data
    }

    // Insert login history record using the authenticated user's ID from the token
    const { error: insertError } = await supabase
      .from('login_history')
      .insert({
        user_id: user.id, // Use verified user ID from token, not from request body
        ip_address: ipAddress,
        location: locationData,
        user_agent: userAgent,
        login_method: loginMethod,
        success: true,
      });

    if (insertError) {
      console.error('Error inserting login history:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to track login' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Login tracked for user ${user.id} from ${ipAddress}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ip: ipAddress,
        location: locationData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in track-login function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

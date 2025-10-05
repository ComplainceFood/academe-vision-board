import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoginTrackingRequest {
  userId: string;
  loginMethod?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, loginMethod = 'password' }: LoginTrackingRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get IP address from request headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || '0.0.0.0';

    // Get user agent
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // Get location data from IP using ipapi.co (free tier: 1000 req/day)
    let locationData = {};
    try {
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
    } catch (error) {
      console.error('Error fetching location data:', error);
      // Continue without location data
    }

    // Insert login history record
    const { error: insertError } = await supabase
      .from('login_history')
      .insert({
        user_id: userId,
        ip_address: ipAddress,
        location: locationData,
        user_agent: userAgent,
        login_method: loginMethod,
        success: true,
      });

    if (insertError) {
      console.error('Error inserting login history:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to track login', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

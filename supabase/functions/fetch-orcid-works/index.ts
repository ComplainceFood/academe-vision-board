import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrcidWork {
  title: string;
  journalTitle?: string;
  publicationDate?: string;
  doi?: string;
  url?: string;
  contributors?: string[];
  type?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orcidId, userId } = await req.json();

    if (!orcidId) {
      return new Response(
        JSON.stringify({ error: 'ORCID ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate ORCID format (0000-0000-0000-0000)
    const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
    if (!orcidRegex.test(orcidId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid ORCID format. Expected: 0000-0000-0000-0000' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching ORCID works for: ${orcidId}`);

    // Fetch works from ORCID public API
    const orcidResponse = await fetch(
      `https://pub.orcid.org/v3.0/${orcidId}/works`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!orcidResponse.ok) {
      if (orcidResponse.status === 404) {
        return new Response(
          JSON.stringify({ error: 'ORCID profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`ORCID API error: ${orcidResponse.status}`);
    }

    const orcidData = await orcidResponse.json();
    console.log(`Found ${orcidData.group?.length || 0} work groups`);

    // Parse ORCID works into a simpler format
    const works: OrcidWork[] = [];
    
    if (orcidData.group && Array.isArray(orcidData.group)) {
      for (const group of orcidData.group) {
        const workSummary = group['work-summary']?.[0];
        if (!workSummary) continue;

        const title = workSummary.title?.title?.value || 'Untitled';
        const journalTitle = workSummary['journal-title']?.value;
        
        // Parse publication date
        let publicationDate: string | undefined;
        if (workSummary['publication-date']) {
          const year = workSummary['publication-date'].year?.value;
          const month = workSummary['publication-date'].month?.value || '01';
          const day = workSummary['publication-date'].day?.value || '01';
          if (year) {
            publicationDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }

        // Get DOI or URL
        let doi: string | undefined;
        let url: string | undefined;
        if (workSummary['external-ids']?.['external-id']) {
          for (const extId of workSummary['external-ids']['external-id']) {
            if (extId['external-id-type'] === 'doi') {
              doi = extId['external-id-value'];
              url = `https://doi.org/${doi}`;
            } else if (extId['external-id-type'] === 'url' && !url) {
              url = extId['external-id-url']?.value || extId['external-id-value'];
            }
          }
        }

        // Map work type
        const workType = workSummary.type || 'other';

        works.push({
          title,
          journalTitle,
          publicationDate,
          doi,
          url,
          type: workType,
        });
      }
    }

    console.log(`Parsed ${works.length} works`);

    // If userId is provided, also fetch the profile to get researcher name
    let researcherName: string | undefined;
    if (userId) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Fetch profile name
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('display_name, first_name, last_name')
        .eq('user_id', userId)
        .single();

      if (profile) {
        researcherName = profile.display_name || 
          [profile.first_name, profile.last_name].filter(Boolean).join(' ');
      }

      // Update profile with ORCID ID
      await supabaseClient
        .from('profiles')
        .update({ orcid_id: orcidId })
        .eq('user_id', userId);

      console.log(`Updated profile with ORCID ID for user: ${userId}`);
    }

    // Also fetch person info from ORCID
    let orcidName: string | undefined;
    try {
      const personResponse = await fetch(
        `https://pub.orcid.org/v3.0/${orcidId}/person`,
        {
          headers: { 'Accept': 'application/json' },
        }
      );
      
      if (personResponse.ok) {
        const personData = await personResponse.json();
        const givenNames = personData.name?.['given-names']?.value;
        const familyName = personData.name?.['family-name']?.value;
        if (givenNames || familyName) {
          orcidName = [givenNames, familyName].filter(Boolean).join(' ');
        }
      }
    } catch (e) {
      console.log('Could not fetch ORCID person info:', e);
    }

    return new Response(
      JSON.stringify({
        orcidId,
        works,
        totalWorks: works.length,
        researcherName: researcherName || orcidName,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching ORCID works:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch ORCID data' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// OpenAlex API — free, no key required
// Docs: https://docs.openalex.org

const OPENALEX_BASE = "https://api.openalex.org";
const EMAIL_PARAM = "mailto=academe-vision-board@app.com"; // polite pool

export interface AuthorMetrics {
  hIndex: number;
  i10Index: number;
  totalCitations: number;
  worksCount: number;
  openAlexId?: string;
}

export interface WorkCitationResult {
  doi: string;
  citedByCount: number;
  openAlexId?: string;
}

/** Fetch author-level metrics by ORCID iD */
export async function fetchAuthorMetrics(orcidId: string): Promise<AuthorMetrics | null> {
  try {
    const url = `${OPENALEX_BASE}/authors?filter=orcid:${orcidId}&${EMAIL_PARAM}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;

    const data = await res.json();
    const author = data.results?.[0];
    if (!author) return null;

    return {
      hIndex: author.summary_stats?.h_index ?? 0,
      i10Index: author.summary_stats?.i10_index ?? 0,
      totalCitations: author.cited_by_count ?? 0,
      worksCount: author.works_count ?? 0,
      openAlexId: author.id,
    };
  } catch {
    return null;
  }
}

/** Fetch citation count for a single DOI */
async function fetchWorkByDoi(doi: string): Promise<WorkCitationResult | null> {
  try {
    const encodedDoi = encodeURIComponent(`https://doi.org/${doi}`);
    const url = `${OPENALEX_BASE}/works/${encodedDoi}?${EMAIL_PARAM}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;

    const data = await res.json();
    return {
      doi,
      citedByCount: data.cited_by_count ?? 0,
      openAlexId: data.id,
    };
  } catch {
    return null;
  }
}

/** Fetch citation counts for multiple DOIs (extracted from tags like "doi:10.xxx") */
export async function fetchCitationsForDois(
  dois: string[]
): Promise<Map<string, number>> {
  const results = new Map<string, number>();
  if (dois.length === 0) return results;

  // Batch: OpenAlex supports up to 50 filter values with | separator
  const chunks: string[][] = [];
  for (let i = 0; i < dois.length; i += 50) {
    chunks.push(dois.slice(i, i + 50));
  }

  for (const chunk of chunks) {
    try {
      const filter = chunk
        .map((d) => `doi:https://doi.org/${d}`)
        .join("|");
      const url = `${OPENALEX_BASE}/works?filter=${encodeURIComponent(filter)}&select=doi,cited_by_count&per_page=50&${EMAIL_PARAM}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) continue;

      const data = await res.json();
      for (const work of data.results ?? []) {
        const rawDoi = work.doi?.replace("https://doi.org/", "");
        if (rawDoi) results.set(rawDoi.toLowerCase(), work.cited_by_count ?? 0);
      }
    } catch {
      // Fallback: fetch individually
      for (const doi of chunk) {
        const r = await fetchWorkByDoi(doi);
        if (r) results.set(doi.toLowerCase(), r.citedByCount);
      }
    }
  }

  return results;
}

export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
}

/**
 * Searches the web via Serper.dev (Google custom search API).
 * Free tier: 2500 requests/month. Set SERPER_API_KEY in .env.
 */
export async function searchWeb(query: string, maxResults = 5): Promise<WebSearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: maxResults }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  const organic: any[] = data.organic ?? [];

  return organic
    .slice(0, maxResults)
    .map((r) => ({
      title: r.title ?? "",
      snippet: r.snippet ?? "",
      url: r.link ?? "",
    }));
}

/**
 * Formats web results into a SOURCES block suitable for the LLM prompt.
 */
export function formatWebSources(results: WebSearchResult[]): string {
  if (results.length === 0) return "";
  return results
    .map(
      (r, i) =>
        `[WEB-${i + 1}] "${r.title}"\n${r.snippet}\nSource: ${r.url}`
    )
    .join("\n\n");
}

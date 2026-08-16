import { XMLParser } from "fast-xml-parser";

export interface ArxivPaper {
  arxivId: string;
  title: string;
  authors: string[];
  summary: string;
  url: string;
  published: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Searches arXiv's public export API (no key required) for papers
 * relevant to a natural-language query, across title/abstract/authors.
 */
export async function searchArxiv(query: string, maxResults = 5): Promise<ArxivPaper[]> {
  const searchQuery = `all:${encodeURIComponent(query)}`;
  const url =
    `https://export.arxiv.org/api/query?search_query=${searchQuery}` +
    `&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Marginalia-Research-Assistant/1.0" },
    // arXiv's feed changes slowly; a short cache keeps repeated
    // queries in one session from hammering the API.
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`arXiv API responded with ${res.status}`);
  }

  const xml = await res.text();
  const parsed = parser.parse(xml);
  const entries = toArray(parsed?.feed?.entry);

  return entries.map((entry): ArxivPaper => {
    const idUrl: string = entry.id ?? "";
    const arxivId = idUrl.split("/abs/").pop() ?? idUrl;
    const authors = toArray(entry.author).map((a) =>
      typeof a === "string" ? a : a?.name ?? "Unknown"
    );

    return {
      arxivId,
      title: cleanText(entry.title ?? "Untitled"),
      authors,
      summary: cleanText(entry.summary ?? ""),
      url: idUrl,
      published: entry.published ?? "",
    };
  });
}

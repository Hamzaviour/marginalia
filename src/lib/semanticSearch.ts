import { ArxivPaper } from "./arxiv";

/**
 * Score a paper against a query using token-overlap heuristics.
 * Title tokens count 3×, summary tokens count 1×.
 * Returns papers sorted descending by score.
 */
export function rerankBySemanticScore(papers: ArxivPaper[], query: string): ArxivPaper[] {
  const qTokens = tokenize(query.toLowerCase());
  if (qTokens.length === 0) return papers;

  return papers
    .map((p) => {
      const titleTokens = tokenize(p.title.toLowerCase());
      const summaryTokens = tokenize(p.summary.toLowerCase());

      let score = 0;
      for (const qt of qTokens) {
        if (titleTokens.includes(qt)) score += 3;
        if (summaryTokens.includes(qt)) score += 1;
      }
      // Bonus for exact phrase match in title
      const queryLower = query.toLowerCase();
      if (p.title.toLowerCase().includes(queryLower)) score += 10;
      // Bonus for exact phrase match in summary
      if (p.summary.toLowerCase().includes(queryLower)) score += 5;

      return { paper: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ paper }) => paper);
}

function tokenize(text: string): string[] {
  return text
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/**
 * Extract key terms from a query by removing stop words and keeping
 * tokens of length ≥ 3 (heuristic for content words).
 */
export function extractQueryTerms(query: string): string[] {
  const stops = new Set([
    "the","a","an","is","are","was","were","what","how","why","when","where",
    "which","who","whom","this","that","these","those","i","you","he","she",
    "we","they","me","him","her","us","them","my","your","his","its","our",
    "their","can","could","would","should","will","shall","did","do","does",
    "not","no","nor","but","and","or","for","with","without","about","into",
    "through","during","before","after","above","below","between","from","to",
    "over","under","again","further","then","once","here","there","each","any",
    "all","both","few","more","most","other","some","such","than","too","very",
    "just","because","as","until","while","of","at","by","if","only","own",
    "same","so","up","out","be","been","being","have","has","had","having",
    "am","in","it","its","are","was","were","be","being","had","have","has",
    "will","would","shall","should","may","might","must","can","could",
  ]);
  return tokenize(query).filter((t) => !stops.has(t) && t.length >= 2);
}

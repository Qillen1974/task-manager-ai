import axios from "axios";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface WebSearchResponse {
  results: SearchResult[];
  query: string;
}

export async function webSearch(
  query: string,
  apiKey: string,
  numResults = 5
): Promise<WebSearchResponse> {
  const clamped = Math.max(1, Math.min(10, numResults));

  const response = await axios.post(
    "https://google.serper.dev/search",
    { q: query, num: clamped },
    {
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      timeout: 15_000,
    }
  );

  const organic: Array<{ title?: string; link?: string; snippet?: string }> =
    response.data?.organic || [];

  const results: SearchResult[] = organic.slice(0, clamped).map((r) => ({
    title: r.title || "",
    link: r.link || "",
    snippet: r.snippet || "",
  }));

  return { results, query };
}

export function formatSearchResults(res: WebSearchResponse): string {
  if (res.results.length === 0) {
    return `Web search for "${res.query}" returned no results.`;
  }

  const lines = res.results.map(
    (r, i) =>
      `${i + 1}. ${r.title}\n   ${r.link}\n   ${r.snippet}`
  );

  return `Web search results for "${res.query}":\n\n${lines.join("\n\n")}`;
}

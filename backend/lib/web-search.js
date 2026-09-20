/**
 * Standalone web search helper using DuckDuckGo HTML search.
 * Requires no external dependencies or API keys.
 */

function cleanHtml(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Searches the web via DuckDuckGo HTML.
 * @param {string} query - The search query.
 * @param {number} [maxResults=4] - Maximum number of search results to return.
 * @returns {Promise<Array<{ title: string, snippet: string, url: string }>>}
 */
async function searchWeb(query, maxResults = 4) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return [];
  }

  const cleanQuery = query.trim();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.8'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`DuckDuckGo search responded with HTTP ${response.status}`);
      return [];
    }

    const html = await response.text();
    const results = [];
    const blocks = html.split(/class="[^"]*web-result[^"]*"/);

    for (let i = 1; i < blocks.length && results.length < maxResults; i++) {
      const block = blocks[i];
      const titleMatch = block.match(/<a rel="nofollow" class="result__a"[^>]*>([\s\S]*?)<\/a>/i);
      const snippetMatch = block.match(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i);
      const urlMatch = block.match(/href="([^"]*uddg=[^"]*)"/i);

      if (!titleMatch) continue;

      let link = '';
      if (urlMatch) {
        const m = urlMatch[1].match(/uddg=([^&]+)/);
        if (m) {
          try {
            link = decodeURIComponent(m[1]);
          } catch {
            link = m[1];
          }
        }
      }

      const title = cleanHtml(titleMatch[1]);
      const snippet = cleanHtml(snippetMatch ? snippetMatch[1] : '');

      if (title && link) {
        results.push({ title, snippet, url: link });
      }
    }

    return results;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('Web search error:', error.message);
    return [];
  }
}

module.exports = {
  searchWeb
};

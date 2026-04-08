export default {
  async fetch(request) {
    const url = new URL(request.url);

    // ===================================================
    // CORS
    // ===================================================
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        }
      });
    }

    // ===================================================
    // ПАРАМЕТРЫ ЗАПРОСА
    // ===================================================
    const query = url.searchParams.get("Query") || url.searchParams.get("query");
    if (!query) {
      return jsonResponse({ Results: [], Indexers: [] });
    }

    // ===================================================
    // ФИЛЬТРЫ И КЛЮЧЕВЫЕ СЛОВА
    // ===================================================
    const videoKeywords = /\b(mkv|mp4|avi|mov|wmv|ts|m2ts|remux|bluray|blu-ray|bdrip|webrip|webdl|web-dl|hdtv|hdrip|dvdrip|xvid|x264|x265|hevc|h264|h265|1080p|720p|2160p|4k|uhd|av1)\b/i;

    // ===================================================
    // ПАРАЛЛЕЛЬНЫЕ ЗАПРОСЫ
    // ===================================================
    const RUTOR_CATEGORIES = [1, 2, 4, 5, 10];
    const encQuery = encodeURIComponent(query);

    try {
      const promises = [
        // Запросы к Rutor по категориям
        ...RUTOR_CATEGORIES.map(cat => 
          fetch(`http://rutor.info/search/0/${cat}/300/0/${encQuery}`).then(r => r.text()).catch(() => "")
        ),
        // Запрос к Kinozal
        fetch(`https://kinozal.tv/browse.php?s=${encQuery}`).then(r => r.text()).catch(() => "")
      ];

      const results = await Promise.all(promises);
      const combinedResults = [];

      // Обработка Rutor (упрощенный парсинг строк таблицы)
      results.slice(0, RUTOR_CATEGORIES.length).forEach(html => {
        const matches = html.matchAll(/<tr><td>.*?<\/td><td.*?><a href="\/torrent\/(\d+).*?">(.*?)<\/a>.*?<\/td><\/tr>/g);
        for (const m of matches) {
          if (videoKeywords.test(m[2])) {
            combinedResults.push({
              Title: m[2],
              Guid: `http://rutor.info/torrent/${m[1]}`,
              Indexer: "Rutor"
            });
          }
        }
      });

      // Обработка Kinozal
      const kinozalHtml = results[results.length - 1];
      const kzMatches = kinozalHtml.matchAll(/<a href="\/details\.php\?id=(\d+)" class="r\d+">(.*?)<\/a>/g);
      for (const m of kzMatches) {
        if (videoKeywords.test(m[2])) {
          combinedResults.push({
            Title: m[2],
            Guid: `https://kinozal.tv/details.php?id=${m[1]}`,
            Indexer: "Kinozal"
          });
        }
      }

      return jsonResponse({
        Results: combinedResults,
        Indexers: ["Rutor", "Kinozal"]
      });

    } catch (e) {
      return jsonResponse({ Error: e.message, Results: [] }, 500);
    }
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://tahacimen.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const blockedHost = (hostname: string) => {
  const host = hostname.toLowerCase();
  return host === "localhost"
    || host.endsWith(".local")
    || host === "0.0.0.0"
    || host === "::1"
    || /^127\./.test(host)
    || /^10\./.test(host)
    || /^192\.168\./.test(host)
    || /^169\.254\./.test(host)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
};

const safeUrl = (value: string) => {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || blockedHost(url.hostname)) {
    throw new Error("Bu adres güvenlik nedeniyle getirilemiyor.");
  }
  return url;
};

const fetchPage = async (initial: URL) => {
  let current = initial;
  for (let index = 0; index < 4; index += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "MixGame-LinkPreview/1.0",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Yönlendirme adresi bulunamadı.");
      current = safeUrl(new URL(location, current).href);
      continue;
    }
    if (!response.ok) throw new Error(`Sayfa ${response.status} yanıtı verdi.`);
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html")) throw new Error("Bağlantı bir HTML sayfası değil.");
    const length = Number(response.headers.get("content-length") || 0);
    if (length > 2_000_000) throw new Error("Sayfa önizleme için çok büyük.");
    return { html: (await response.text()).slice(0, 2_000_000), finalUrl: current };
  }
  throw new Error("Çok fazla yönlendirme var.");
};

const decode = (value = "") => value
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">");

const meta = (html: string, key: string) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const first = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i").exec(html);
  const second = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i").exec(html);
  return decode(first?.[1] || second?.[1] || "").trim();
};

const link = (html: string, rel: string) => {
  const escaped = rel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const first = new RegExp(`<link[^>]+rel=["'][^"']*${escaped}[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>`, "i").exec(html);
  const second = new RegExp(`<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*${escaped}[^"']*["'][^>]*>`, "i").exec(html);
  return decode(first?.[1] || second?.[1] || "").trim();
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const { url: rawUrl } = await request.json();
    const requestedUrl = safeUrl(String(rawUrl || ""));
    const { html, finalUrl } = await fetchPage(requestedUrl);
    const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || "";
    const imageValue = meta(html, "og:image") || meta(html, "twitter:image");
    const iconValue = link(html, "apple-touch-icon") || link(html, "icon") || "/favicon.ico";
    const resolve = (value: string) => value ? new URL(value, finalUrl).href : "";

    return Response.json({
      title: meta(html, "og:title") || decode(titleTag).trim() || finalUrl.hostname,
      description: meta(html, "og:description") || meta(html, "description"),
      image: resolve(imageValue),
      favicon: resolve(iconValue),
      siteName: meta(html, "og:site_name") || finalUrl.hostname.replace(/^www\./, ""),
      url: finalUrl.href,
    }, { headers: { ...corsHeaders, "Cache-Control": "public, max-age=3600" } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Bilgiler getirilemedi." },
      { status: 400, headers: corsHeaders },
    );
  }
});

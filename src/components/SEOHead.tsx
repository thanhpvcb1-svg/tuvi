import { useEffect } from "react";

type Props = {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
  noindex?: boolean;
};

const SITE_URL = "https://tuviphonglam.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

// Cloudflare Pages 308-redirect "/x" -> "/x/" cho route đã prerender (dist/x/index.html),
// nên canonical/og:url luôn dùng dạng có "/" cuối để trùng URL thật trả về 200.
const toCanonicalUrl = (path: string) => `${SITE_URL}${path.endsWith("/") ? path : `${path}/`}`;

const upsertMeta = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
};

export default function SEOHead({ title, description, canonicalPath, ogImage = DEFAULT_OG_IMAGE, schema, noindex = false }: Props) {
  useEffect(() => {
    document.title = title;

    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: noindex ? "noindex,nofollow" : "index,follow" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: toCanonicalUrl(canonicalPath) });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: ogImage });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "Tử Vi Phong Lam" });
    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: "vi_VN" });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: ogImage });

    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = toCanonicalUrl(canonicalPath);
    document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]').forEach((link) => {
      link.href = toCanonicalUrl(canonicalPath);
    });

    const schemaId = "route-structured-data";
    const existing = document.getElementById(schemaId);
    if (existing) {
      existing.remove();
    }

    if (schema) {
      const script = document.createElement("script");
      script.id = schemaId;
      script.type = "application/ld+json";
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }, [title, description, canonicalPath, ogImage, schema, noindex]);

  return null;
}

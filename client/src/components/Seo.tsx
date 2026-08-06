import { useEffect } from "react";

type SeoProps = {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
  keywords?: string;
  schema?: Record<string, unknown> | Record<string, unknown>[];
};

function upsertMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function Seo({ title, description, canonicalPath, image, keywords, schema }: SeoProps) {
  useEffect(() => {
    const canonical = new URL(canonicalPath, window.location.origin).toString();
    const absoluteImage = image ? new URL(image, window.location.origin).toString() : undefined;

    document.title = title;
    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertMeta('meta[name="robots"]', "name", "robots", "index,follow,max-image-preview:large");
    upsertMeta('meta[property="og:type"]', "property", "og:type", "website");
    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[property="og:url"]', "property", "og:url", canonical);
    upsertMeta('meta[property="og:site_name"]', "property", "og:site_name", "NexxusTECH");
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);

    if (absoluteImage) {
      upsertMeta('meta[property="og:image"]', "property", "og:image", absoluteImage);
      upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", absoluteImage);
    }
    if (keywords) upsertMeta('meta[name="keywords"]', "name", "keywords", keywords);

    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    const scriptId = "nexxustech-structured-data";
    document.getElementById(scriptId)?.remove();
    if (schema) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => document.getElementById(scriptId)?.remove();
  }, [canonicalPath, description, image, keywords, schema, title]);

  return null;
}

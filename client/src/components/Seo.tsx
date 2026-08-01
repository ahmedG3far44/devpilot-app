import { useEffect } from "react";

interface SeoProps {
  title: string;
  description?: string;
  keywords?: string;
  canonicalPath?: string;
  noindex?: boolean;
  ogImage?: string;
  ogType?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const upsertMeta = (attr: "name" | "property", key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const upsertJsonLd = (data: Record<string, unknown>[]) => {
  let el = document.head.querySelector<HTMLScriptElement>(
    'script[data-jsonld="page"]',
  );
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-jsonld", "page");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
};

const removeJsonLd = () => {
  document.head
    .querySelectorAll<HTMLScriptElement>('script[data-jsonld="page"]')
    .forEach((el) => el.remove());
};

const siteOrigin = () =>
  typeof window !== "undefined" ? window.location.origin : "";

const Seo = ({
  title,
  description,
  keywords,
  canonicalPath = "/",
  noindex = false,
  ogImage = "/icon.svg",
  ogType = "website",
  jsonLd,
}: SeoProps) => {
  useEffect(() => {
    const canonicalUrl = `${siteOrigin()}${canonicalPath}`;
    const fullTitle = title.includes("DevPilot")
      ? title
      : `${title} | DevPilot`;

    document.title = fullTitle;

    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
      upsertMeta("name", "twitter:description", description);
    }

    if (keywords) upsertMeta("name", "keywords", keywords);

    upsertMeta(
      "name",
      "robots",
      noindex ? "noindex, nofollow" : "index, follow",
    );

    upsertLink("canonical", canonicalUrl);

    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:type", ogType);
    upsertMeta("property", "og:site_name", "DevPilot");
    upsertMeta("property", "og:image", `${siteOrigin()}${ogImage}`);

    upsertMeta("name", "twitter:card", noindex ? "summary" : "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:image", `${siteOrigin()}${ogImage}`);

    if (jsonLd) {
      upsertJsonLd(Array.isArray(jsonLd) ? jsonLd : [jsonLd]);
    } else {
      removeJsonLd();
    }

    return () => {
      if (!jsonLd) removeJsonLd();
    };
  }, [
    title,
    description,
    keywords,
    canonicalPath,
    noindex,
    ogImage,
    ogType,
    jsonLd,
  ]);

  return null;
};

export default Seo;

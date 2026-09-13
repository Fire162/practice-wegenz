import { useEffect } from "react";

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setMetaName(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function usePageMeta({
  title,
  description,
  canonical,
  ogImage,
}: {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
}) {
  useEffect(() => {
    // Document Title
    document.title = title;
    setMetaProperty("og:title", title);
    setMetaName("twitter:title", title);

    // Description
    if (description) {
      setMetaName("description", description);
      setMetaProperty("og:description", description);
      setMetaName("twitter:description", description);
    }

    // Canonical & OG URL
    if (canonical) {
      const fullCanonical = canonical.startsWith("http")
        ? canonical
        : `https://wegenz.in${canonical.startsWith("/") ? "" : "/"}${canonical}`;

      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", fullCanonical);
      setMetaProperty("og:url", fullCanonical);
    }

    // OG Image
    if (ogImage) {
      const fullImage = ogImage.startsWith("http")
        ? ogImage
        : `https://wegenz.in${ogImage.startsWith("/") ? "" : "/"}${ogImage}`;
      setMetaProperty("og:image", fullImage);
      setMetaName("twitter:image", fullImage);
    }
  }, [title, description, canonical, ogImage]);
}

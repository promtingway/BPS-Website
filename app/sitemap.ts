import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://bps-sourcing.de", lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
}

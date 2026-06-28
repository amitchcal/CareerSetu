import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://careersetu.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/(app)/", "/onboarding/", "/dashboard/"],
      },
      // Allow AI crawlers that respect training opt-out via robots.txt
      {
        userAgent: "GPTBot",
        allow: ["/", "/pricing", "/about", "/try"],
        disallow: ["/api/", "/(app)/"],
      },
      {
        userAgent: "anthropic-ai",
        allow: ["/", "/pricing", "/about", "/try"],
        disallow: ["/api/", "/(app)/"],
      },
      {
        userAgent: "Claude-Web",
        allow: ["/", "/pricing", "/about", "/try"],
        disallow: ["/api/", "/(app)/"],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/pricing", "/about", "/try"],
        disallow: ["/api/", "/(app)/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}

import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/seller/dashboard",
          "/backoffice",
          "/admin",
          "/auth/error",
        ],
      },
      { userAgent: "Googlebot", allow: "/" },
    ],
    sitemap: "https://keyzaa.com/sitemap.xml",
  };
}

import type { MetadataRoute } from "next";

// PWA manifest — installability for staff and parents on phones.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trinity Heights School ERP",
    short_name: "Trinity Heights",
    description:
      "School management for Trinity Heights Senior High School, Kumasi.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F1ED",
    theme_color: "#722F37",
    icons: [
      // TODO: add proper 192/512 PNG icons; favicon is a placeholder.
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Collectors' Tune Tracker",
    short_name: "CTT",
    description: "The crate-digger's logbook.",
    start_url: "/",
    display: "standalone",
    background_color: "#1C191A",
    theme_color: "#1C191A",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}

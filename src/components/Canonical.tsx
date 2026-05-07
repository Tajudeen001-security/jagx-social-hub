import { useEffect } from "react";

const SITE = "https://jagx-buddy-connect.name.ng";
const VERIFICATION = "HPbR4lJzhWsLx08KzRCNcICTA9hs2F55rsSODKhWT5A";

/**
 * Sets <link rel="canonical"> for the current page and re-asserts the Google
 * site-verification meta tag (in case any runtime code stripped it).
 * Pass an explicit `path` (e.g. "/reels?v=abc") to override window.location.
 */
export const Canonical = ({ path }: { path?: string }) => {
  useEffect(() => {
    const url = SITE + (path ?? (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"));

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = url;

    // Ensure Google verification tag is present (safety net)
    let verify = document.querySelector('meta[name="google-site-verification"]') as HTMLMetaElement | null;
    if (!verify) {
      verify = document.createElement("meta");
      verify.name = "google-site-verification";
      document.head.appendChild(verify);
    }
    verify.content = VERIFICATION;
  }, [path]);
  return null;
};

export default Canonical;
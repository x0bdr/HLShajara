"use client";

import { useEffect } from "react";
import { pushDataLayer, GTM_EVENTS } from "@/lib/gtm";

export function PublicationTracker({ slug, locale }: { slug: string; locale: string }) {
  useEffect(() => {
    pushDataLayer(GTM_EVENTS.PUBLICATION_READ, { slug, locale });
  }, [slug, locale]);

  return null;
}

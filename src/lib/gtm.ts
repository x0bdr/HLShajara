declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

export function pushDataLayer(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event,
      ...data,
    });
  }
}

export const GTM_EVENTS = {
  PAGE_VIEW: "page_view",
  SUBMIT_CLICK: "submit_click",
  PUBLICATION_READ: "publication_read",
  RECORD_FILTER: "record_filter",
  LOGIN: "login",
} as const;

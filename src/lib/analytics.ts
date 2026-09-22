/**
 * Google Analytics Event Tracking Utilities
 * 
 * Sử dụng:
 * - trackEvent('button_click', { button_name: 'lap_la_so' })
 * - trackPageView('/lap-la-so')
 * - trackConversion('lead_form_submit', { form_location: 'homepage' })
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

type EventParams = Record<string, string | number | boolean>;

/**
 * Track custom event
 */
export const trackEvent = (eventName: string, params?: EventParams) => {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("event", eventName, params);
};

/**
 * Track page view (for SPA navigation)
 */
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("event", "page_view", {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });
};

/**
 * Track conversion events
 */
export const trackConversion = (conversionType: string, params?: EventParams) => {
  trackEvent(conversionType, {
    ...params,
    conversion: true,
  });
};

// Pre-defined events for the app
export const Analytics = {
  // Chart events
  chartGenerated: (params?: { has_birth_time: boolean; calendar_type: string }) => {
    trackEvent("chart_generated", params);
  },

  chartExported: (format: "png" | "jpg" | "json") => {
    trackEvent("chart_exported", { format });
  },

  // AI Analysis events
  aiAnalysisRequested: () => {
    trackEvent("ai_analysis_requested");
  },

  aiAnalysisCompleted: (success: boolean) => {
    trackEvent("ai_analysis_completed", { success });
  },

  // Lead events
  leadFormViewed: (location: string) => {
    trackEvent("lead_form_viewed", { location });
  },

  leadFormSubmitted: (location: string, interest?: string) => {
    trackConversion("lead_form_submitted", { location, interest: interest || "not_specified" });
  },

  // Pricing events
  pricingViewed: () => {
    trackEvent("pricing_viewed");
  },

  planSelected: (planName: string, planPrice: string) => {
    trackEvent("plan_selected", { plan_name: planName, plan_price: planPrice });
  },

  // Contact events
  contactClicked: (channel: "zalo" | "facebook" | "sms" | "email") => {
    trackEvent("contact_clicked", { channel });
  },

  briefCopied: () => {
    trackEvent("brief_copied");
  },

  // Navigation events
  sampleChartViewed: (sampleId: string) => {
    trackEvent("sample_chart_viewed", { sample_id: sampleId });
  },

  articleViewed: (articleSlug: string) => {
    trackEvent("article_viewed", { article_slug: articleSlug });
  },

  videoClicked: (videoId: string, platform: string) => {
    trackEvent("video_clicked", { video_id: videoId, platform });
  },
};

export default Analytics;

import React, { Suspense, useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FloatingContactLinks from "./components/FloatingContactLinks";
import MobileStickyCTA from "./components/MobileStickyCTA";
import SiteFooter from "./components/SiteFooter";
import SocialProofPopup from "./components/SocialProofPopup";
import ThemeToggle from "./components/ThemeToggle";
import { AppProvider, useAppContext } from "./context/AppContext";
import { scheduleKnowledgePreload } from "./lib/tuvi/knowledge/lazyKnowledgeLoader";
// HomePage tải eager (trang vào phổ biến nhất, tránh flash loading ở lần vào đầu).
// Các trang còn lại tải lazy theo route để trang chủ/blog/... không phải kéo theo
// chart engine (iztro, tuvi-lib) và các lib chỉ /lap-la-so mới cần (leaflet, html-to-image).
import HomePage from "./pages/HomePage";
const ChartPage = React.lazy(() => import("./pages/ChartPage"));
const PricingPage = React.lazy(() => import("./pages/PricingPage"));
const SampleChartsPage = React.lazy(() => import("./pages/SampleChartsPage"));
const ContactPage = React.lazy(() => import("./pages/ContactPage"));
const CompatPage = React.lazy(() => import("./pages/CompatPage"));
const FAQPage = React.lazy(() => import("./pages/FAQPage"));
const BlogPage = React.lazy(() => import("./pages/BlogPage"));
const VideoPage = React.lazy(() => import("./pages/VideoPage"));
const TermsPage = React.lazy(() => import("./pages/TermsPage"));
const PrivacyPage = React.lazy(() => import("./pages/PrivacyPage"));
const AboutPage = React.lazy(() => import("./pages/AboutPage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));
import type { BirthInput } from "./lib/types";

// ============ TYPES ============

// "/lap-la-so/" -> "/lap-la-so" (giữ nguyên "/")
const normalizePath = (pathname: string) => pathname.replace(/\/+$/, "") || "/";

type MainPageId ="home" | "lap-la-so" | "bang-gia" | "la-so-mau" | "blog" | "faq" | "hop-tuoi" | "lien-he" | "video" | "terms" | "privacy" | "about" | "404";
type HomeSectionId = "la-so-mau" | "kien-thuc" | "faq" | "premium" | "hop-tuoi" | "lien-he" | "gioi-thieu";

const homeSectionRoutes: Record<HomeSectionId, string> = {
  "la-so-mau": "/la-so-mau",
  "kien-thuc": "/bai-viet",
  premium: "/bang-gia",
  faq: "/faq",
  "hop-tuoi": "/hop-tuoi",
  "lien-he": "/lien-he",
  "gioi-thieu": "/gioi-thieu",
};

// ============ MAIN APP CONTENT ============

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetWorkspace, handleGenerateFromInput, setBirthInput } = useAppContext();
  
  const [activePage, setActivePage] = useState<MainPageId>("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Preload Knowledge Base (~34MB) chỉ khi đang ở trang lập lá số - nơi duy nhất
  // có thể dẫn tới "Luận giải". Trước đây gọi vô điều kiện nên mọi trang (Blog, FAQ,
  // Trang chủ...) đều âm thầm tải hết Knowledge Base sau 15s dù không liên quan.
  // StreamingAnalysis vẫn tự load ngay khi cần nếu preload này chưa kịp chạy.
  useEffect(() => {
    if (activePage !== "lap-la-so") return;
    scheduleKnowledgePreload(15000);
  }, [activePage]);

  // Route to page mapping
  useEffect(() => {
    // Cloudflare Pages phục vụ route prerender ở dạng có "/" cuối (/lap-la-so/) -> bỏ "/" cuối trước khi so route.
    const path = normalizePath(location.pathname);
    
    if (path === "/lap-la-so") {
      setActivePage("lap-la-so");
    } else if (path === "/bang-gia" || path === "/premium") {
      setActivePage("bang-gia");
    } else if (path === "/la-so-mau") {
      setActivePage("la-so-mau");
    } else if (path === "/blog" || path === "/kien-thuc" || path === "/bai-viet" || 
               path.startsWith("/blog/") || path.startsWith("/kien-thuc/") || path.startsWith("/bai-viet/")) {
      setActivePage("blog");
    } else if (path === "/faq") {
      setActivePage("faq");
    } else if (path === "/hop-tuoi") {
      setActivePage("hop-tuoi");
    } else if (path === "/lien-he") {
      setActivePage("lien-he");
    } else if (path === "/video" || path === "/bai-hoc-ngan") {
      setActivePage("video");
    } else if (path === "/dieu-khoan-su-dung" || path === "/terms") {
      setActivePage("terms");
    } else if (path === "/chinh-sach-bao-mat" || path === "/privacy") {
      setActivePage("privacy");
    } else if (path === "/gioi-thieu" || path === "/about" || path === "/ve-chung-toi") {
      setActivePage("about");
    } else if (path === "/404") {
      setActivePage("404");
    } else {
      setActivePage("home");
    }
  }, [location.pathname]);

  // Mobile menu body scroll lock
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  // Navigation handlers
  const navigateHome = useCallback(() => {
    setIsMobileMenuOpen(false);
    navigate("/");
  }, [navigate]);

  const navigateChartForm = useCallback(() => {
    setIsMobileMenuOpen(false);
    resetWorkspace("/lap-la-so");
  }, [resetWorkspace]);

  const navigateHomeSection = useCallback((section: HomeSectionId) => {
    setIsMobileMenuOpen(false);
    navigate(homeSectionRoutes[section]);
  }, [navigate]);

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen((prev) => !prev), []);

  const getNavLinkClass = (route: string) =>
    `site-nav-link${normalizePath(location.pathname) === route || (route !== "/" && location.pathname.startsWith(`${route}/`)) ? " is-active" : ""}`;

  const handleSampleChartSelect = useCallback((input: BirthInput) => {
    setBirthInput(input);
    handleGenerateFromInput(input);
  }, [setBirthInput, handleGenerateFromInput]);

  // Render current page
  const renderPage = () => {
    switch (activePage) {
      case "home":
        return <HomePage onNavigateChartForm={navigateChartForm} onNavigateSection={navigateHomeSection} />;
      case "lap-la-so":
        return <ChartPage />;
      case "bang-gia":
        return <PricingPage onNavigateChartForm={navigateChartForm} />;
      case "la-so-mau":
        return <SampleChartsPage onNavigateChartForm={navigateChartForm} onGenerateFromInput={handleSampleChartSelect} />;
      case "hop-tuoi":
        return <CompatPage onNavigateChartForm={navigateChartForm} />;
      case "lien-he":
        return <ContactPage onNavigateChartForm={navigateChartForm} />;
      case "blog":
        return <BlogPage />;
      case "video":
        return <VideoPage />;
      case "faq":
        return <FAQPage />;
      case "terms":
        return <TermsPage />;
      case "privacy":
        return <PrivacyPage />;
      case "about":
        return <AboutPage />;
      case "404":
        return <NotFoundPage />;
      default:
        return <HomePage onNavigateChartForm={navigateChartForm} onNavigateSection={navigateHomeSection} />;
    }
  };

  const showMobileStickyCTA = activePage === "home" || activePage === "la-so-mau" || activePage === "bang-gia";

  return (
    <div className="site-shell">
      <a href="#main-content" className="skip-link">Bỏ qua đến nội dung chính</a>
      
      {/* Header */}
      <header className="site-header">
        <div className="site-header-inner">
          <button type="button" className="site-brand" onClick={navigateHome}>
            <span className="site-brand-mark">T</span>
            <span className="site-brand-copy">
              <strong>Tử Vi Phong Lam</strong>
              <small>Luận Giải Vận Mệnh</small>
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="site-nav site-nav--desktop" aria-label="Điều hướng chính">
            <button type="button" className={getNavLinkClass("/")} onClick={navigateHome}>Trang chủ</button>
            <button type="button" className={getNavLinkClass("/lap-la-so")} onClick={navigateChartForm}>Lập lá số</button>
            <button type="button" className={getNavLinkClass("/la-so-mau")} onClick={() => navigateHomeSection("la-so-mau")}>Lá số mẫu</button>
            <button type="button" className={getNavLinkClass("/bai-viet")} onClick={() => navigateHomeSection("kien-thuc")}>Bài viết</button>
            <button type="button" className={getNavLinkClass("/video")} onClick={() => navigate("/video")}>Video</button>
            <button type="button" className={getNavLinkClass("/bang-gia")} onClick={() => navigateHomeSection("premium")}>Bảng giá</button>
            <button type="button" className={getNavLinkClass("/ve-chung-toi")} onClick={() => navigate("/ve-chung-toi")}>Về chúng tôi</button>
            <button type="button" className={getNavLinkClass("/lien-he")} onClick={() => navigateHomeSection("lien-he")}>Liên hệ</button>
          </nav>

          <div className="site-auth site-auth--desktop">
            <ThemeToggle />
            <button type="button" className="primary-button site-login-button" onClick={navigateChartForm}>
              Lập Lá Số Miễn Phí
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className={`mobile-menu-toggle ${isMobileMenuOpen ? "is-open" : ""}`}
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={isMobileMenuOpen}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen ? (
          <div className="mobile-menu-overlay" onClick={closeMobileMenu}>
            <nav className="mobile-menu" onClick={(e) => e.stopPropagation()} aria-label="Menu di động">
              <div className="mobile-menu-header">
                <span className="mobile-menu-title">Menu</span>
                <div className="mobile-menu-header-actions">
                  <ThemeToggle />
                  <button type="button" className="mobile-menu-close" onClick={closeMobileMenu} aria-label="Đóng menu">×</button>
                </div>
              </div>
              <div className="mobile-menu-links">
                <button type="button" className={getNavLinkClass("/")} onClick={navigateHome}>Trang chủ</button>
                <button type="button" className={getNavLinkClass("/lap-la-so")} onClick={navigateChartForm}>Lập lá số</button>
                <button type="button" className={getNavLinkClass("/la-so-mau")} onClick={() => navigateHomeSection("la-so-mau")}>Lá số mẫu</button>
                <button type="button" className={getNavLinkClass("/bai-viet")} onClick={() => navigateHomeSection("kien-thuc")}>Bài viết</button>
                <button type="button" className={getNavLinkClass("/video")} onClick={() => { closeMobileMenu(); navigate("/video"); }}>Video</button>
                <button type="button" className={getNavLinkClass("/bang-gia")} onClick={() => navigateHomeSection("premium")}>Bảng giá</button>
                <button type="button" className={getNavLinkClass("/ve-chung-toi")} onClick={() => { closeMobileMenu(); navigate("/ve-chung-toi"); }}>Về chúng tôi</button>
                <button type="button" className={getNavLinkClass("/lien-he")} onClick={() => navigateHomeSection("lien-he")}>Liên hệ</button>
              </div>
              <div className="mobile-menu-cta">
                <button type="button" className="primary-button" onClick={navigateChartForm}>Lập Lá Số Miễn Phí</button>
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      {/* Main Content */}
      <main id="main-content" className="site-main">
        <Suspense fallback={<div className="page-loading-fallback" aria-busy="true" />}>
          {renderPage()}
        </Suspense>
      </main>

      {/* Footer & Floating Elements */}
      <MobileStickyCTA
        show={showMobileStickyCTA}
        onPrimaryClick={navigateChartForm}
        onSecondaryClick={() => navigate("/bang-gia")}
      />
      <FloatingContactLinks />
      <SocialProofPopup />
      <SiteFooter />
    </div>
  );
}

// ============ APP WITH PROVIDER ============

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

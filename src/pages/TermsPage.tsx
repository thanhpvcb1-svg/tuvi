import React from "react";
import SEOHead from "../components/SEOHead";
import TermsPageContent from "../components/TermsPage";
import { organizationSchema, breadcrumbSchema } from "../schemas/seoSchemas";

export default function TermsPage() {
  return (
    <>
      <SEOHead
        title="Điều Khoản Sử Dụng Dịch Vụ | Tử Vi Phong Lam"
        description="Điều khoản và điều kiện sử dụng dịch vụ lập lá số tử vi online trên Tử Vi Phong Lam."
        canonicalPath="/dieu-khoan-su-dung"
        schema={[
          organizationSchema,
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Điều khoản sử dụng", path: "/dieu-khoan-su-dung" }]),
        ]}
      />
      <div className="home-page">
        <TermsPageContent />
      </div>
    </>
  );
}

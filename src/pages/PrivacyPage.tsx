import React from "react";
import SEOHead from "../components/SEOHead";
import PrivacyPolicyPageContent from "../components/PrivacyPolicyPage";
import { organizationSchema, breadcrumbSchema } from "../schemas/seoSchemas";

export default function PrivacyPage() {
  return (
    <>
      <SEOHead
        title="Chính Sách Bảo Mật Thông Tin | Tử Vi Phong Lam"
        description="Chính sách bảo mật và cách Tử Vi Phong Lam bảo vệ thông tin cá nhân của bạn."
        canonicalPath="/chinh-sach-bao-mat"
        schema={[
          organizationSchema,
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Chính sách bảo mật", path: "/chinh-sach-bao-mat" }]),
        ]}
      />
      <div className="home-page">
        <PrivacyPolicyPageContent />
      </div>
    </>
  );
}

import React from "react";
import SEOHead from "../components/SEOHead";
import PrivacyPolicyPageContent from "../components/PrivacyPolicyPage";
import { organizationSchema, breadcrumbSchema } from "../schemas/seoSchemas";

export default function PrivacyPage() {
  return (
    <>
      <SEOHead
        title="Chính Sách Bảo Mật Thông Tin | TuViPhongLam"
        description="Chính sách bảo mật và cách TuViPhongLam bảo vệ thông tin cá nhân của bạn."
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

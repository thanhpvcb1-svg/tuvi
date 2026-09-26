import React from "react";
import SEOHead from "../components/SEOHead";
import VideoLessonsPage from "../components/VideoLessonsPage";
import { organizationSchema, videoGallerySchema, breadcrumbSchema } from "../schemas/seoSchemas";

export default function VideoPage() {
  return (
    <>
      <SEOHead
        title="Video Học Tử Vi Bắc Phái - Tứ Hóa Phi Tinh | Tử Vi Phong Lam"
        description="Tổng hợp video ngắn hướng dẫn Tử Vi Bắc Phái, Tứ Hóa Phi Tinh, cách đọc lá số dễ hiểu cho người mới."
        canonicalPath="/video"
        schema={[
          organizationSchema,
          videoGallerySchema,
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Video", path: "/video" }]),
        ]}
      />
      <VideoLessonsPage />
    </>
  );
}

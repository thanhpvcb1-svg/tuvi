import React from "react";

type Props = {
  onInterpret: () => void;
  onDownloadImage: () => void;
  onCopyLink: () => void;
  onReset: () => void;
  isInterpreting: boolean;
  isReadingOpen: boolean;
  isDownloadingImage: boolean;
};

export default function ExportActions({
  onInterpret,
  onDownloadImage,
  onCopyLink,
  onReset,
  isInterpreting,
  isReadingOpen,
  isDownloadingImage,
}: Props) {
  return (
    <section className="result-block">
      <div className="section-heading section-heading--compact">
        <p className="eyebrow">Hành động</p>
        <h2>Lưu, chia sẻ và tạo lại lá số</h2>
      </div>

      <div className="export-actions">
        <button type="button" className="ghost-button" onClick={onInterpret} disabled={isInterpreting}>
          {isInterpreting ? "Đang phân tích..." : isReadingOpen ? "Ẩn luận giải Bắc Phái" : "Luận giải Bắc Phái bằng AI"}
        </button>
        <button type="button" className="ghost-button" onClick={onDownloadImage}>
          {isDownloadingImage ? "Đang tải ảnh..." : "Tải ảnh lá số"}
        </button>
        <button type="button" className="ghost-button" onClick={onCopyLink}>
          Sao chép liên kết
        </button>
        <button type="button" className="ghost-button" onClick={onReset}>
          Lập lá số mới
        </button>
        <button type="button" className="ghost-button" disabled title="Sắp ra mắt">
          Gửi qua email
        </button>
      </div>
    </section>
  );
}

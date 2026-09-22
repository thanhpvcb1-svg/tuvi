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
        <p className="eyebrow">Bước tiếp theo</p>
        <h2>Luận giải và lưu lá số</h2>
      </div>

      <div className="export-actions">
        <button type="button" className="primary-button" onClick={onInterpret} disabled={isInterpreting}>
          {isInterpreting ? "Đang phân tích..." : isReadingOpen ? "Ẩn luận giải" : "🔮 Luận giải lá số"}
        </button>
        <button type="button" className="ghost-button" onClick={onDownloadImage} disabled={isDownloadingImage}>
          {isDownloadingImage ? "Đang tải..." : "Tải ảnh"}
        </button>
        <button type="button" className="ghost-button" onClick={onCopyLink}>
          Sao chép link
        </button>
        <button type="button" className="ghost-button" onClick={onReset}>
          Lập lá số mới
        </button>
      </div>
    </section>
  );
}

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
        <p className="eyebrow">🚀 Bước tiếp theo</p>
        <h2>Luận giải và lưu lá số</h2>
      </div>

      <div className="export-actions export-actions--enhanced">
        <button 
          type="button" 
          className="primary-button export-btn export-btn--primary" 
          onClick={onInterpret} 
          disabled={isInterpreting}
          aria-busy={isInterpreting}
        >
          <span className="export-btn__icon">🔮</span>
          <span className="export-btn__text">
            {isInterpreting ? "Đang phân tích..." : isReadingOpen ? "Ẩn luận giải" : "Luận giải lá số"}
          </span>
        </button>
        <button 
          type="button" 
          className="ghost-button export-btn" 
          onClick={onDownloadImage} 
          disabled={isDownloadingImage}
          aria-busy={isDownloadingImage}
        >
          <span className="export-btn__icon">🖼️</span>
          <span className="export-btn__text">{isDownloadingImage ? "Đang tải..." : "Tải ảnh"}</span>
        </button>
        <button type="button" className="ghost-button export-btn" onClick={onCopyLink}>
          <span className="export-btn__icon">🔗</span>
          <span className="export-btn__text">Sao chép link</span>
        </button>
        <button type="button" className="ghost-button export-btn" onClick={onReset}>
          <span className="export-btn__icon">✨</span>
          <span className="export-btn__text">Lập lá số mới</span>
        </button>
      </div>
    </section>
  );
}

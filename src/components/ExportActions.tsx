import React from "react";

type Props = {
  onDownloadImage: () => void;
  onCopyLink: () => void;
  onReset: () => void;
  isDownloadingImage: boolean;
};

export default function ExportActions({ onDownloadImage, onCopyLink, onReset, isDownloadingImage }: Props) {
  return (
    <section className="result-block">
      <div className="section-heading section-heading--compact">
        <p className="eyebrow">Hành động</p>
        <h2>Lưu, chia sẻ và tạo lại lá số</h2>
      </div>

      <div className="export-actions">
        <button type="button" className="ghost-button" title="TODO: triển khai export PDF hoàn chỉnh" disabled>
          Tải PDF
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


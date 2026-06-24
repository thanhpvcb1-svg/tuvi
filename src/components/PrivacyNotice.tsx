import React from "react";

type Props = {
  showClearAction?: boolean;
  onClear?: () => void;
};

export default function PrivacyNotice({ showClearAction = false, onClear }: Props) {
  return (
    <section className="privacy-notice" id="privacy" aria-label="Quyền riêng tư">
      <div>
        <p className="eyebrow">Quyền riêng tư</p>
        <h2>Thông tin của bạn được dùng như thế nào?</h2>
      </div>
      <ul className="privacy-list">
        <li>Thông tin bạn nhập được dùng để an lá số và hiển thị kết quả trên trình duyệt.</li>
        <li>Trang không hiển thị công khai dữ liệu cá nhân của bạn cho người khác.</li>
        <li>Nếu dùng máy chung, bạn không nên nhập thêm các thông tin nhạy cảm ngoài dữ liệu cần cho lá số.</li>
        <li>Bạn có thể xóa dữ liệu đã lưu trên trình duyệt nếu không muốn giữ lại cho lần xem sau.</li>
      </ul>
      {showClearAction ? (
        <button type="button" className="ghost-button privacy-clear-button" onClick={onClear}>
          Xóa dữ liệu đã lưu
        </button>
      ) : null}
    </section>
  );
}

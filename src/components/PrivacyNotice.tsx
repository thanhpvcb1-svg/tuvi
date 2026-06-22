import React from "react";

type Props = {
  showClearAction?: boolean;
  onClear?: () => void;
};

export default function PrivacyNotice({ showClearAction = false, onClear }: Props) {
  return (
    <section className="privacy-notice" aria-label="Quyền riêng tư">
      <div>
        <p className="eyebrow">Quyền riêng tư</p>
        <h2>Thông tin của bạn được dùng như thế nào?</h2>
      </div>
      <ul className="privacy-list">
        <li>Thông tin bạn nhập chỉ dùng để lập lá số trên trình duyệt.</li>
        <li>Không công khai thông tin cá nhân cho người khác.</li>
        <li>Không nên nhập thông tin nhạy cảm nếu bạn không muốn lưu lại trên thiết bị.</li>
        <li>Hiện tại hệ thống không lưu lá số sau khi bạn đóng trình duyệt.</li>
      </ul>
      {showClearAction ? (
        <button type="button" className="ghost-button privacy-clear-button" onClick={onClear}>
          Xóa dữ liệu đã lưu
        </button>
      ) : null}
    </section>
  );
}


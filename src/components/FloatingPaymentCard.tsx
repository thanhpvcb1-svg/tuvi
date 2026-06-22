import React from "react";

type Props = {
  onClick: () => void;
};

export default function FloatingPaymentCard({ onClick }: Props) {
  return (
    <aside className="floating-payment-card" aria-label="Dịch vụ hỏi 1 câu theo lá số">
      <p className="eyebrow">Gói nổi bật</p>
      <h3>Luận giải 1 câu hỏi bất kỳ</h3>
      <strong>50.000đ / câu</strong>
      <p>
        Hỏi trực tiếp về công việc, tình duyên, tài lộc hoặc vận hạn dựa trên lá số của bạn.
      </p>
      <button type="button" className="primary-button" onClick={onClick}>
        Hỏi ngay
      </button>
    </aside>
  );
}

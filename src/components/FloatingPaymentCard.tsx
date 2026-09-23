import React from "react";

type Props = {
  onClick: () => void;
};

export default function FloatingPaymentCard({ onClick }: Props) {
  return (
    <aside className="floating-payment-card" aria-label="Gói hỏi 1 câu theo lá số">
      <p className="eyebrow">Gói phổ biến</p>
      <h3>Hỏi 1 câu theo lá số</h3>
      <strong>50.000đ / câu</strong>
      <p>Phù hợp khi bạn cần làm rõ một vấn đề cụ thể về công việc, tài chính, tình cảm hoặc vận năm.</p>
      <button type="button" className="primary-button" onClick={onClick}>
        Xem chi tiết
      </button>
    </aside>
  );
}

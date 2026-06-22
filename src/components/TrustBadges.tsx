import React from "react";

const badges = [
  "Miễn phí tạo lá số",
  "Không cần đăng ký",
  "Dữ liệu chỉ dùng để lập lá số",
  "Có thể hỏi thêm theo lá số",
];

export default function TrustBadges() {
  return (
    <div className="trust-badges" aria-label="Điểm tin cậy">
      {badges.map((badge) => (
        <span key={badge} className="trust-badge">
          {badge}
        </span>
      ))}
    </div>
  );
}

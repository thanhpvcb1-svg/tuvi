import React from "react";

const badges = [
  "Lập lá số miễn phí",
  "Không cần đăng ký",
  "Dữ liệu dùng để an lá số",
  "Có thể hỏi thêm khi cần",
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

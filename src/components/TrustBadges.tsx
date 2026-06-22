import React from "react";

const badges = [
  "Miễn phí tạo lá số",
  "Luận giải dễ hiểu",
  "Không cần đăng ký",
  "Bảo mật thông tin cá nhân",
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

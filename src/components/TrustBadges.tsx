import React from "react";

const badges = [
  { icon: "✨", text: "Lập lá số miễn phí" },
  { icon: "🔒", text: "Không cần đăng ký" },
  { icon: "🛡️", text: "Dữ liệu dùng để an lá số" },
  { icon: "💬", text: "Có thể hỏi thêm khi cần" },
];

export default function TrustBadges() {
  return (
    <div className="trust-badges" aria-label="Điểm tin cậy">
      {badges.map((badge) => (
        <span key={badge.text} className="trust-badge">
          <span className="trust-badge__icon" aria-hidden="true">{badge.icon}</span>
          {badge.text}
        </span>
      ))}
    </div>
  );
}

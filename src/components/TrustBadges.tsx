import React, { useState, useEffect } from "react";

// Lấy số lá số đã lập từ localStorage (demo) hoặc API
function getChartCount(): number {
  try {
    const stored = localStorage.getItem("total_charts_generated");
    const base = 12847; // Số base để hiển thị
    const local = stored ? parseInt(stored, 10) : 0;
    return base + local;
  } catch {
    return 12847;
  }
}

// Increment counter khi lập lá số mới
export function incrementChartCount(): void {
  try {
    const current = parseInt(localStorage.getItem("total_charts_generated") || "0", 10);
    localStorage.setItem("total_charts_generated", String(current + 1));
  } catch {}
}

const badges = [
  { icon: "✨", text: "Lập lá số miễn phí" },
  { icon: "🔒", text: "Không cần đăng ký" },
  { icon: "🛡️", text: "Dữ liệu dùng để an lá số" },
  { icon: "💬", text: "Có thể hỏi thêm khi cần" },
];

export default function TrustBadges() {
  const [chartCount, setChartCount] = useState(0);

  useEffect(() => {
    setChartCount(getChartCount());
  }, []);

  const formattedCount = chartCount.toLocaleString("vi-VN");

  return (
    <div className="trust-badges-wrapper">
      {chartCount > 0 && (
        <div className="trust-counter" aria-label="Số lá số đã lập">
          <span className="trust-counter__number">{formattedCount}+</span>
          <span className="trust-counter__label">lá số đã được lập</span>
        </div>
      )}
      <div className="trust-badges" aria-label="Điểm tin cậy">
        {badges.map((badge) => (
          <span key={badge.text} className="trust-badge">
            <span className="trust-badge__icon" aria-hidden="true">{badge.icon}</span>
            {badge.text}
          </span>
        ))}
      </div>
    </div>
  );
}

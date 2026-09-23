import React, { useState } from "react";
import type { StarView } from "../lib/types";

const starDescriptions: Record<string, string> = {
  "Tử Vi": "Đế tinh, chủ về quyền quý, lãnh đạo",
  "Thiên Cơ": "Mưu lược, thông minh, biến động",
  "Thái Dương": "Quang minh, nam giới, sự nghiệp",
  "Vũ Khúc": "Tài tinh, quyết đoán, kim loại",
  "Thiên Đồng": "Phúc tinh, an nhàn, hưởng thụ",
  "Liêm Trinh": "Thứ đào hoa, pháp luật, tù ngục",
  "Thiên Phủ": "Tài khố, ổn định, bảo thủ",
  "Thái Âm": "Nữ giới, điền sản, tài lộc âm",
  "Tham Lang": "Đào hoa, dục vọng, nghệ thuật",
  "Cự Môn": "Thị phi, khẩu tài, tranh luận",
  "Thiên Tướng": "Ấn tinh, quý nhân, phò tá",
  "Thiên Lương": "Ấm tinh, che chở, y dược",
  "Thất Sát": "Tướng tinh, quyền uy, cô độc",
  "Phá Quân": "Hao tinh, phá cách, biến động",
  "Văn Xương": "Văn tinh, học vấn, khoa bảng",
  "Văn Khúc": "Văn tinh, nghệ thuật, tài hoa",
  "Tả Phụ": "Quý nhân, phò tá bên trái",
  "Hữu Bật": "Quý nhân, phò tá bên phải",
  "Thiên Khôi": "Quý nhân dương, gặp may",
  "Thiên Việt": "Quý nhân âm, được giúp đỡ",
  "Lộc Tồn": "Chính tài, tích lũy, bền vững",
  "Thiên Mã": "Di chuyển, thay đổi, xuất ngoại",
  "Hóa Lộc": "Tài lộc, thuận lợi, phát triển",
  "Hóa Quyền": "Quyền lực, kiểm soát, tranh đấu",
  "Hóa Khoa": "Danh tiếng, học vấn, quý nhân",
  "Hóa Kỵ": "Trở ngại, thị phi, chấp niệm",
  "Kình Dương": "Sát tinh, cương quyết, tai họa",
  "Đà La": "Sát tinh, trì trệ, kéo dài",
  "Hỏa Tinh": "Sát tinh, nóng nảy, bùng nổ",
  "Linh Tinh": "Sát tinh, âm ỉ, dai dẳng",
  "Địa Không": "Không vong, mất mát, tâm linh",
  "Địa Kiếp": "Kiếp sát, biến động, mất mát",
  "Thiên Hình": "Hình phạt, pháp luật, y học",
  "Thiên Riêu": "Đào hoa, sắc dục, nghệ thuật",
  "Thiên Hỷ": "Vui mừng, hôn nhân, sinh nở",
  "Hồng Loan": "Đào hoa chính, hôn nhân",
  "Thiên Đức": "Phúc đức, che chở, may mắn",
  "Nguyệt Đức": "Phúc đức âm, quý nhân nữ",
};

export default function StarText({ star }: { star: StarView }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const extraClass = star.scope === "annual" || star.scope === "monthly" || star.scope === "daily" || star.scope === "hourly" ? " star-luu" : "";
  const description = starDescriptions[star.name];
  
  return (
    <span
      className={`star ${star.colorGroup}${extraClass}${description ? " star-has-tooltip" : ""}`}
      style={star.color ? { color: star.color } : undefined}
      onMouseEnter={() => description && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => description && setShowTooltip(true)}
      onTouchEnd={() => setShowTooltip(false)}
    >
      {star.display ?? `${star.name}${star.brightness ? `(${star.brightness})` : ""}`}
      {showTooltip && description ? (
        <span className="star-tooltip">{description}</span>
      ) : null}
    </span>
  );
}

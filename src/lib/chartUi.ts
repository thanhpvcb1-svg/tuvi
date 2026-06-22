import type { ChartView, PalaceView, StarView } from "./types";

export type SummaryCard = {
  label: string;
  value: string;
  hint?: string;
};

export type QuickReadingCard = {
  id: string;
  title: string;
  icon: string;
  summary: string;
  detail: string;
};

export function normalizeVietnameseText(value: string | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function findPalace(chart: ChartView, ...aliases: string[]) {
  const aliasKeys = aliases.map(normalizeVietnameseText);
  return chart.palaces.find((palace) => aliasKeys.includes(normalizeVietnameseText(palace.name)));
}

export function getStarLabel(star: StarView) {
  return star.display || star.name;
}

export function getTopStars(palace: PalaceView | undefined, limit = 3) {
  if (!palace) {
    return [];
  }

  const stars = [...(palace.centerStars ?? palace.majorStars), ...(palace.leftStars ?? palace.goodStars), ...(palace.rightStars ?? palace.badStars)];
  return Array.from(new Set(stars.map(getStarLabel).filter(Boolean))).slice(0, limit);
}

export function getPalaceMeaning(name: string) {
  const key = normalizeVietnameseText(name);
  const meaningMap: Record<string, string> = {
    menh: "Phản ánh khí chất, cách thể hiện bản thân và nền tảng tính cách.",
    "phu mau": "Gợi ý về gia đình gốc, mối liên hệ với cha mẹ và hậu thuẫn ban đầu.",
    "phuc duc": "Liên quan đến phúc khí, nền tảng tinh thần và sự nâng đỡ lâu dài.",
    "dien trach": "Gợi mở về nhà cửa, tài sản tích lũy và môi trường sống.",
    "quan loc": "Phản ánh xu hướng nghề nghiệp, vai trò xã hội và tham vọng phát triển.",
    "no boc": "Cho thấy mạng lưới cộng sự, bạn bè, người hỗ trợ và cách hợp tác.",
    "thien di": "Liên quan đến cơ hội khi ra ngoài, môi trường xã hội và dịch chuyển.",
    "tat ach": "Nhắc đến sức khỏe, áp lực tinh thần và những điều cần lưu tâm.",
    "tai bach": "Gợi ý về dòng tiền, cách kiếm tiền và khả năng quản lý tài chính.",
    "tu tuc": "Liên quan đến con cái, dự định cá nhân và thành quả gây dựng.",
    "phu the": "Cho biết xu hướng tình cảm, hôn nhân và cách kết nối với bạn đời.",
    "huynh de": "Phản ánh quan hệ anh chị em, bạn đồng hành và người ngang vai.",
  };

  return meaningMap[key] ?? "Đây là một lớp thông tin tham khảo trong lá số tử vi.";
}

export function buildSummaryCards(chart: ChartView, horoscopeYear: number, birthYear: number): SummaryCard[] {
  const bodyPalace = chart.palaces.find((palace) => palace.isBodyPalace);
  const age = horoscopeYear - birthYear;

  return [
    { label: "Mệnh", value: chart.profile.natalElementName || "Đang cập nhật" },
    { label: "Thân", value: bodyPalace?.name || chart.profile.bodyPalaceBranch || "Đang cập nhật" },
    { label: "Cục", value: chart.profile.fiveElementsClass || "Đang cập nhật" },
    { label: "Âm dương", value: chart.profile.yinYangLabel || "Đang cập nhật" },
    { label: "Ngũ hành", value: chart.profile.elementalStatus || "Đang cập nhật" },
    { label: "Năm xem hạn", value: String(horoscopeYear), hint: "Có thể đổi trực tiếp ở thanh vận hạn." },
    { label: "Tuổi âm tham khảo", value: age >= 0 ? String(age + 1) : "Chưa xác định" },
  ];
}

export function buildQuickReadings(chart: ChartView): QuickReadingCard[] {
  const menhPalace = findPalace(chart, "Mệnh");
  const quanLocPalace = findPalace(chart, "Quan Lộc");
  const taiBachPalace = findPalace(chart, "Tài Bạch");
  const phuThePalace = findPalace(chart, "Phu Thê");
  const tatAchPalace = findPalace(chart, "Tật Ách");

  const buildText = (palace: PalaceView | undefined, fallback: string) => {
    const stars = getTopStars(palace);
    if (!palace || stars.length === 0) {
      return fallback;
    }

    return `Nổi bật với ${stars.join(", ")} tại cung ${palace.name}. Đây là gợi ý nhanh để bạn đọc tổng quan trước khi xem chi tiết từng cung.`;
  };

  return [
    {
      id: "personality",
      title: "Tổng quan tính cách",
      icon: "◐",
      summary: buildText(menhPalace, "Lá số cho thấy nền tảng tính cách cần đọc thêm ở cung Mệnh để hiểu rõ hơn."),
      detail: "Tập trung vào khí chất, cách ra quyết định và xu hướng tự thể hiện.",
    },
    {
      id: "career",
      title: "Sự nghiệp",
      icon: "▣",
      summary: buildText(quanLocPalace, "Cần xem thêm cung Quan Lộc để có nhận định sự nghiệp rõ hơn."),
      detail: "Ưu tiên đọc thêm phần Quan Lộc, Thiên Di và Nô Bộc để hiểu cách phát triển công việc.",
    },
    {
      id: "finance",
      title: "Tài lộc",
      icon: "◈",
      summary: buildText(taiBachPalace, "Tài lộc nên được đọc kết hợp cung Tài Bạch và Điền Trạch."),
      detail: "Phần này thiên về xu hướng quản lý tiền và khả năng tạo nguồn thu, không thay thế tư vấn tài chính.",
    },
    {
      id: "relationships",
      title: "Tình duyên / gia đạo",
      icon: "♡",
      summary: buildText(phuThePalace, "Muốn đọc kỹ phần tình duyên, hãy xem thêm cung Phu Thê và Phúc Đức."),
      detail: "Nên xem như một lớp tham khảo về xu hướng kết nối, không phải kết luận tuyệt đối.",
    },
    {
      id: "wellbeing",
      title: "Sức khỏe / tinh thần",
      icon: "☼",
      summary: buildText(tatAchPalace, "Phần sức khỏe tinh thần cần được đọc như tín hiệu tham khảo để chủ động chăm sóc bản thân."),
      detail: "Thông tin tử vi không thay thế chẩn đoán hay tư vấn chuyên môn về y tế.",
    },
  ];
}


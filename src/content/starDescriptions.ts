/**
 * Mô tả ngắn cho tooltip khi hover sao trên lá số (StarText).
 * Key dùng đúng tên hiển thị sau toPreferredStarName (vd "Tả Phù", "Thiên Hỉ", "Thiên Diêu").
 * Nội dung là nghĩa cổ điển tóm lược, chỉ mang tính gợi ý - luận giải thật còn tùy vị trí, độ sáng và tổ hợp sao.
 */
import { toPreferredStarName } from "../lib/tuvi/rules/preferredStarNames";

export const starDescriptions: Record<string, string> = {
  // 14 chính tinh
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

  // Lục cát, Lộc Mã
  "Văn Xương": "Văn tinh, học vấn, khoa bảng",
  "Văn Khúc": "Văn tinh, nghệ thuật, tài hoa",
  "Tả Phù": "Quý nhân, phò tá bên trái",
  "Hữu Bật": "Quý nhân, phò tá bên phải",
  "Thiên Khôi": "Quý nhân dương, gặp may",
  "Thiên Việt": "Quý nhân âm, được giúp đỡ",
  "Lộc Tồn": "Chính tài, tích lũy, bền vững",
  "Thiên Mã": "Di chuyển, thay đổi, xuất ngoại",

  // Tứ Hóa
  "Hóa Lộc": "Tài lộc, thuận lợi, phát triển",
  "Hóa Quyền": "Quyền lực, kiểm soát, tranh đấu",
  "Hóa Khoa": "Danh tiếng, học vấn, quý nhân",
  "Hóa Kỵ": "Trở ngại, thị phi, chấp niệm",

  // Lục sát và sát tinh khác
  "Kình Dương": "Sát tinh, cương quyết, tai họa",
  "Đà La": "Sát tinh, trì trệ, kéo dài",
  "Hỏa Tinh": "Sát tinh, nóng nảy, bùng nổ",
  "Linh Tinh": "Sát tinh, âm ỉ, dai dẳng",
  "Địa Không": "Không vong, mất mát, tâm linh",
  "Địa Kiếp": "Kiếp sát, biến động, mất mát",
  "Thiên Không": "Hư không, ý tưởng viển vông, dễ hụt hẫng",
  "Kiếp Sát": "Sát tinh, tai nạn bất ngờ, hao tổn",

  // Vòng Bác Sĩ
  "Bác Sĩ": "Thông minh, học thức, giảm nhẹ tai ách",
  "Lực Sĩ": "Sức mạnh, quyền lực, dũng cảm",
  "Thanh Long": "Hỷ sự, tin vui, thăng tiến",
  "Tiểu Hao": "Hao tán nhỏ, tiêu xài, mất vặt",
  "Tướng Quân": "Uy dũng, quyền hành, nóng nảy",
  "Tấu Thư": "Văn thư, giấy tờ, khéo ăn nói",
  "Phi Liêm": "Nhanh nhẹn, thị phi, tiểu nhân",
  "Hỷ Thần": "Vui vẻ, tin mừng, hỷ sự",
  "Bệnh Phù": "Bệnh tật, sức khỏe suy giảm",
  "Đại Hao": "Hao tán lớn, tiêu phá tài sản",
  "Phục Binh": "Tiểu nhân ngầm, bị ám hại, lừa lọc",
  "Quan Phủ": "Kiện tụng, rắc rối pháp lý",

  // Vòng Thái Tuế
  "Thái Tuế": "Ngôn luận, tranh cãi, uy quyền của năm",
  "Thiếu Dương": "Thông minh, vui vẻ, may mắn nhỏ",
  "Tang Môn": "Tang chế, buồn phiền, chia ly",
  "Thiếu Âm": "Hiền hòa, nhu thuận, phúc nhẹ",
  "Quan Phù": "Thị phi, kiện cáo, giấy tờ pháp lý",
  "Tử Phù": "Buồn rầu, tang tóc, suy giảm",
  "Tuế Phá": "Phá tán, ngang ngạnh, bất hòa",
  "Long Đức": "Phúc thiện, giải trừ tai ách",
  "Bạch Hổ": "Hung tinh, tai nạn, tranh chấp, máu huyết",
  "Phúc Đức": "Phúc thiện, may mắn, giải ách",
  "Điếu Khách": "Ăn nói phô trương, khách viếng, tang sự",
  "Trực Phù": "Cô độc, trắc trở, thị phi ngầm",

  // Vòng Tướng Tinh và các thần sát theo năm
  "Tướng Tinh": "Uy quyền, chỉ huy, võ nghiệp",
  "Phan Án": "Thăng tiến, được nâng đỡ, quyền vị",
  "Tuế Dịch": "Di chuyển, thay đổi, bôn ba",
  "Tức Thần": "Ngưng trệ, mệt mỏi, trì hoãn",
  "Tai Sát": "Tai họa, rủi ro bất ngờ",
  "Thiên Sát": "Áp lực, trở ngại từ bề trên",
  "Chỉ Bối": "Bị dèm pha, nói xấu sau lưng",
  "Nguyệt Sát": "Trắc trở, hao tổn nhỏ, âm tính",
  "Vong Thần": "Hao mất, lo âu, đãng trí",
  "Tuế Kiện": "Khí của năm, chủ biến động trong năm",
  "Hối Khí": "Xui xẻo, buồn phiền, không may",
  "Quán Tác": "Trói buộc, kiện tụng, giam hãm",

  // Cặp sao quý hiển
  "Long Trì": "Văn chương, khoa bảng, nhà cửa",
  "Phượng Các": "Khoa danh, vinh hiển, mỹ thuật",
  "Tam Thai": "Quý hiển, thăng tiến, địa vị",
  "Bát Tọa": "Chức tước, được tôn trọng",
  "Thai Phụ": "Phò tá, giúp đỡ, danh tiếng",
  "Phong Cáo": "Danh dự, bằng khen, ân điển",
  "Ân Quang": "Quý nhân, ân huệ, được nâng đỡ",
  "Thiên Quý": "Quý nhân, phúc đức, được giúp",
  "Thiên Quan": "Quý nhân, chức tước, tín ngưỡng",
  "Thiên Phúc": "Phúc thọ, may mắn, tín ngưỡng",
  "Quốc Ấn": "Ấn tín, chức quyền, được tín nhiệm",
  "Đường Phù": "Chức vị, nhà cửa, quyền thế",
  "LN Văn Tinh": "Văn tinh, học hành, thi cử",

  // Giải thần
  "Thiên Giải": "Giải thần, hóa giải tai họa",
  "Địa Giải": "Giải trừ tai ách, hóa giải",
  "Giải Thần": "Hóa giải bệnh tật, tai ách",
  "Thiên Đức": "Phúc đức, che chở, may mắn",
  "Nguyệt Đức": "Phúc đức âm, quý nhân nữ",

  // Đào hoa, tình duyên
  "Đào Hoa": "Đào hoa, duyên dáng, tình cảm",
  "Hàm Trì": "Đào hoa, ham vui, sắc dục",
  "Hồng Loan": "Đào hoa chính, hôn nhân",
  "Thiên Hỉ": "Vui mừng, hôn nhân, sinh nở",
  "Thiên Diêu": "Đào hoa, sắc dục, mê tín",

  // Tạp diệu khác
  "Thiên Hình": "Hình phạt, pháp luật, y học",
  "Thiên Hư": "Hư hao, buồn phiền, trống rỗng",
  "Thiên Khốc": "Khóc lóc, buồn rầu, tiếng tăm",
  "Thiên Thương": "Hao tổn, sầu muộn, tai ương",
  "Thiên Sứ": "Tai ương, trắc trở, lo âu",
  "Thiên Tài": "Tài năng, khéo léo, ứng biến",
  "Thiên Thọ": "Tuổi thọ, hiền lành, ổn định",
  "Thiên Trù": "Ăn uống, ẩm thực, lộc ăn",
  "Thiên Y": "Y dược, chữa bệnh, giải bệnh",
  "Thiên Vu": "Tâm linh, tôn giáo, được thừa hưởng",
  "Thiên Nguyệt": "Bệnh tật, sức khỏe yếu",
  "Thiên La": "Lưới trời, bị ràng buộc, trở ngại",
  "Địa Võng": "Lưới đất, vướng mắc, kiện tụng",
  "Đẩu Quân": "Nghiêm khắc, cô độc, tự chủ",
  "Hoa Cái": "Cô cao, nghệ thuật, tôn giáo",
  "Âm Sát": "Tiểu nhân ngầm, âm mưu, tâm linh",
  "Cô Thần": "Cô độc, khó gần, lẻ loi",
  "Quả Tú": "Cô quả, lẻ loi, tình duyên muộn",
  "Lưu Hà": "Tai nạn sông nước, máu huyết",
  "Phá Toái": "Phá tán, đổ vỡ, hao tốn",
  "Không Vong": "Hư không, mất mát, trắc trở",

  // Sao lưu đặc biệt
  "Lộc nhập": "Hóa Lộc bay nhập cung - được lợi, thuận",
  "Kỵ nhập": "Hóa Kỵ bay nhập cung - vướng mắc, cần lưu ý",
  "Niên Giải": "Giải thần của năm, hóa giải tai ách",
};

// Tên rút gọn của sao lưu/vận -> tên sao gốc.
const SHORT_LUU_NAMES: Record<string, string> = {
  Hỷ: "Thiên Hỉ",
  Khôi: "Thiên Khôi",
  Việt: "Thiên Việt",
  Xương: "Văn Xương",
  Khúc: "Văn Khúc",
  Loan: "Hồng Loan",
  Dương: "Kình Dương",
  Đà: "Đà La",
  Lộc: "Lộc Tồn",
  Mã: "Thiên Mã",
};

const lookup = (name: string) => starDescriptions[name] ?? starDescriptions[toPreferredStarName(name)];

export function getStarDescription(rawName: string): string | undefined {
  const name = String(rawName || "").trim();
  if (!name) return undefined;

  const direct = lookup(name);
  if (direct) return direct;

  // "L.Thái Tuế" (lưu niên), "ĐH.Hóa Lộc" (đại hạn)
  const prefixed = name.match(/^(L|ĐH)\.(.+)$/);
  if (prefixed) {
    const base = lookup(prefixed[2]);
    return base ? `${prefixed[1] === "L" ? "Lưu niên" : "Đại hạn"} - ${base}` : undefined;
  }

  // "Lưu Xương", "Vận Mã"...
  const short = name.match(/^(Lưu|Vận) (.+)$/);
  if (short) {
    const baseName = SHORT_LUU_NAMES[short[2]] ?? short[2];
    const base = lookup(baseName);
    return base ? `${short[1] === "Lưu" ? "Lưu niên" : "Đại vận"} ${baseName} - ${base}` : undefined;
  }

  return undefined;
}

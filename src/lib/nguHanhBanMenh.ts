export type NguHanhElement = "Kim" | "Mộc" | "Thủy" | "Hỏa" | "Thổ";

export type MenhCucRelation =
  | "dong_hanh"
  | "menh_sinh_cuc"
  | "cuc_sinh_menh"
  | "menh_khac_cuc"
  | "cuc_khac_menh"
  | "unknown";

export type NguHanhBanMenh = {
  canChiNam: string;
  napAm: string;
  hanh: NguHanhElement;
  cuc?: string;
  cucElement?: NguHanhElement;
  menhCucRelation?: MenhCucRelation;
  menhCucRelationLabel?: string;
  shortDescription?: string;
};

type NapAmRecord = {
  napAm: string;
  hanh: NguHanhElement;
};

const NAP_AM_60_HOA_GIAP: Record<string, NapAmRecord> = {
  "Giáp Tý": { napAm: "Hải Trung Kim", hanh: "Kim" },
  "Ất Sửu": { napAm: "Hải Trung Kim", hanh: "Kim" },
  "Bính Dần": { napAm: "Lư Trung Hỏa", hanh: "Hỏa" },
  "Đinh Mão": { napAm: "Lư Trung Hỏa", hanh: "Hỏa" },
  "Mậu Thìn": { napAm: "Đại Lâm Mộc", hanh: "Mộc" },
  "Kỷ Tỵ": { napAm: "Đại Lâm Mộc", hanh: "Mộc" },
  "Canh Ngọ": { napAm: "Lộ Bàng Thổ", hanh: "Thổ" },
  "Tân Mùi": { napAm: "Lộ Bàng Thổ", hanh: "Thổ" },
  "Nhâm Thân": { napAm: "Kiếm Phong Kim", hanh: "Kim" },
  "Quý Dậu": { napAm: "Kiếm Phong Kim", hanh: "Kim" },
  "Giáp Tuất": { napAm: "Sơn Đầu Hỏa", hanh: "Hỏa" },
  "Ất Hợi": { napAm: "Sơn Đầu Hỏa", hanh: "Hỏa" },
  "Bính Tý": { napAm: "Giản Hạ Thủy", hanh: "Thủy" },
  "Đinh Sửu": { napAm: "Giản Hạ Thủy", hanh: "Thủy" },
  "Mậu Dần": { napAm: "Thành Đầu Thổ", hanh: "Thổ" },
  "Kỷ Mão": { napAm: "Thành Đầu Thổ", hanh: "Thổ" },
  "Canh Thìn": { napAm: "Bạch Lạp Kim", hanh: "Kim" },
  "Tân Tỵ": { napAm: "Bạch Lạp Kim", hanh: "Kim" },
  "Nhâm Ngọ": { napAm: "Dương Liễu Mộc", hanh: "Mộc" },
  "Quý Mùi": { napAm: "Dương Liễu Mộc", hanh: "Mộc" },
  "Giáp Thân": { napAm: "Tuyền Trung Thủy", hanh: "Thủy" },
  "Ất Dậu": { napAm: "Tuyền Trung Thủy", hanh: "Thủy" },
  "Bính Tuất": { napAm: "Ốc Thượng Thổ", hanh: "Thổ" },
  "Đinh Hợi": { napAm: "Ốc Thượng Thổ", hanh: "Thổ" },
  "Mậu Tý": { napAm: "Tích Lịch Hỏa", hanh: "Hỏa" },
  "Kỷ Sửu": { napAm: "Tích Lịch Hỏa", hanh: "Hỏa" },
  "Canh Dần": { napAm: "Tùng Bách Mộc", hanh: "Mộc" },
  "Tân Mão": { napAm: "Tùng Bách Mộc", hanh: "Mộc" },
  "Nhâm Thìn": { napAm: "Trường Lưu Thủy", hanh: "Thủy" },
  "Quý Tỵ": { napAm: "Trường Lưu Thủy", hanh: "Thủy" },
  "Giáp Ngọ": { napAm: "Sa Trung Kim", hanh: "Kim" },
  "Ất Mùi": { napAm: "Sa Trung Kim", hanh: "Kim" },
  "Bính Thân": { napAm: "Sơn Hạ Hỏa", hanh: "Hỏa" },
  "Đinh Dậu": { napAm: "Sơn Hạ Hỏa", hanh: "Hỏa" },
  "Mậu Tuất": { napAm: "Bình Địa Mộc", hanh: "Mộc" },
  "Kỷ Hợi": { napAm: "Bình Địa Mộc", hanh: "Mộc" },
  "Canh Tý": { napAm: "Bích Thượng Thổ", hanh: "Thổ" },
  "Tân Sửu": { napAm: "Bích Thượng Thổ", hanh: "Thổ" },
  "Nhâm Dần": { napAm: "Kim Bạch Kim", hanh: "Kim" },
  "Quý Mão": { napAm: "Kim Bạch Kim", hanh: "Kim" },
  "Giáp Thìn": { napAm: "Phú Đăng Hỏa", hanh: "Hỏa" },
  "Ất Tỵ": { napAm: "Phú Đăng Hỏa", hanh: "Hỏa" },
  "Bính Ngọ": { napAm: "Thiên Hà Thủy", hanh: "Thủy" },
  "Đinh Mùi": { napAm: "Thiên Hà Thủy", hanh: "Thủy" },
  "Mậu Thân": { napAm: "Đại Trạch Thổ", hanh: "Thổ" },
  "Kỷ Dậu": { napAm: "Đại Trạch Thổ", hanh: "Thổ" },
  "Canh Tuất": { napAm: "Thoa Xuyến Kim", hanh: "Kim" },
  "Tân Hợi": { napAm: "Thoa Xuyến Kim", hanh: "Kim" },
  "Nhâm Tý": { napAm: "Tang Đố Mộc", hanh: "Mộc" },
  "Quý Sửu": { napAm: "Tang Đố Mộc", hanh: "Mộc" },
  "Giáp Dần": { napAm: "Đại Khê Thủy", hanh: "Thủy" },
  "Ất Mão": { napAm: "Đại Khê Thủy", hanh: "Thủy" },
  "Bính Thìn": { napAm: "Sa Trung Thổ", hanh: "Thổ" },
  "Đinh Tỵ": { napAm: "Sa Trung Thổ", hanh: "Thổ" },
  "Mậu Ngọ": { napAm: "Thiên Thượng Hỏa", hanh: "Hỏa" },
  "Kỷ Mùi": { napAm: "Thiên Thượng Hỏa", hanh: "Hỏa" },
  "Canh Thân": { napAm: "Thạch Lựu Mộc", hanh: "Mộc" },
  "Tân Dậu": { napAm: "Thạch Lựu Mộc", hanh: "Mộc" },
  "Nhâm Tuất": { napAm: "Đại Hải Thủy", hanh: "Thủy" },
  "Quý Hợi": { napAm: "Đại Hải Thủy", hanh: "Thủy" },
};

const CUC_ELEMENT_MAP: Record<string, NguHanhElement> = {
  "Kim Tứ Cục": "Kim",
  "Mộc Tam Cục": "Mộc",
  "Thủy Nhị Cục": "Thủy",
  "Hỏa Lục Cục": "Hỏa",
  "Thổ Ngũ Cục": "Thổ",
};

const ELEMENT_GENERATES: Record<NguHanhElement, NguHanhElement> = {
  Kim: "Thủy",
  Thủy: "Mộc",
  Mộc: "Hỏa",
  Hỏa: "Thổ",
  Thổ: "Kim",
};

const ELEMENT_OVERCOMES: Record<NguHanhElement, NguHanhElement> = {
  Kim: "Mộc",
  Mộc: "Thổ",
  Thổ: "Thủy",
  Thủy: "Hỏa",
  Hỏa: "Kim",
};

const RELATION_LABELS: Record<MenhCucRelation, string> = {
  dong_hanh: "Đồng hành",
  menh_sinh_cuc: "Mệnh sinh Cục",
  cuc_sinh_menh: "Cục sinh Mệnh",
  menh_khac_cuc: "Mệnh khắc Cục",
  cuc_khac_menh: "Cục khắc Mệnh",
  unknown: "Chưa đủ dữ liệu",
};

const RELATION_DESCRIPTIONS: Record<MenhCucRelation, string> = {
  dong_hanh: "Bản mệnh và cục cùng hành, khí tương đối đồng nhất.",
  menh_sinh_cuc: "Bản mệnh sinh cho cục, thường gợi ý bản thân bỏ công sức để nuôi hoàn cảnh.",
  cuc_sinh_menh: "Cục sinh cho bản mệnh, thường gợi ý hoàn cảnh có phần nâng đỡ bản thân.",
  menh_khac_cuc: "Bản mệnh khắc cục, dễ có xu hướng muốn kiểm soát hoàn cảnh.",
  cuc_khac_menh: "Cục khắc bản mệnh, dễ cảm thấy môi trường tạo áp lực hoặc thử thách.",
  unknown: "Thiếu dữ liệu hành bản mệnh hoặc hành cục nên chưa luận phần này.",
};

export function getCanChiYear(yearStem?: string, yearBranch?: string) {
  return yearStem && yearBranch ? `${yearStem} ${yearBranch}` : "";
}

export function getCucElement(cuc?: string): NguHanhElement | undefined {
  return cuc ? CUC_ELEMENT_MAP[cuc] : undefined;
}

export function getMenhCucRelation(
  menhElement?: NguHanhElement,
  cucElement?: NguHanhElement,
): MenhCucRelation {
  if (!menhElement || !cucElement) return "unknown";
  if (menhElement === cucElement) return "dong_hanh";
  if (ELEMENT_GENERATES[menhElement] === cucElement) return "menh_sinh_cuc";
  if (ELEMENT_GENERATES[cucElement] === menhElement) return "cuc_sinh_menh";
  if (ELEMENT_OVERCOMES[menhElement] === cucElement) return "menh_khac_cuc";
  if (ELEMENT_OVERCOMES[cucElement] === menhElement) return "cuc_khac_menh";
  return "unknown";
}

export function buildNguHanhBanMenh(params: {
  yearStem?: string;
  yearBranch?: string;
  cuc?: string;
}): NguHanhBanMenh | undefined {
  const canChiNam = getCanChiYear(params.yearStem, params.yearBranch);
  if (!canChiNam) {
    return undefined;
  }

  const napAmRecord = NAP_AM_60_HOA_GIAP[canChiNam];
  if (!napAmRecord) {
    return undefined;
  }

  const cucElement = getCucElement(params.cuc);
  const menhCucRelation = getMenhCucRelation(napAmRecord.hanh, cucElement);

  return {
    canChiNam,
    napAm: napAmRecord.napAm,
    hanh: napAmRecord.hanh,
    cuc: params.cuc,
    cucElement,
    menhCucRelation,
    menhCucRelationLabel: RELATION_LABELS[menhCucRelation],
    shortDescription:
      "Ngũ hành bản mệnh là hành khí nền tảng theo năm sinh, thường được dùng để xét tương quan với Cục, cung Mệnh và các yếu tố ngũ hành khác trong lá số.",
  };
}


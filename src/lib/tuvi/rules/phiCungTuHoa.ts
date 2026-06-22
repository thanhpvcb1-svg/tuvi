import type { NormalizedPalace, NormalizedStar } from "../config/types";
import { TU_HOA_LABELS, TU_HOA_TABLE, generatePalaceStems } from "../constants/tuHoa";
import { normalizeBranch, normalizeStem } from "../normalize/normalizeBranch";
import { normalizeLookupKey } from "../utils";
import { isOriginalNatalStar, normalizeStarName } from "../utils/starName";

type PhiType = keyof typeof TU_HOA_LABELS;

type PhiFlow = {
  sourcePalaceId: string;
  sourcePalaceName: string;
  sourceStem: string;
  type: PhiType;
  typeLabel: string;
  targetStar: string;
  targetPalaceId: string | null;
  targetPalaceName: string | null;
  targetPalaceShortName: string | null;
  relation: "phi_nhap" | "tu_hoa" | "missing_star";
  displayText: string;
};

type PhiResult = {
  flows: PhiFlow[];
  corner: {
    loc: string | null;
    ky: string | null;
  };
};

const PALACE_SHORT_NAMES: Record<string, string> = {
  menh: "Mệnh",
  "phu mau": "P.Mẫu",
  "phuc duc": "Phúc",
  "dien trach": "Điền",
  "quan loc": "Quan",
  "no boc": "Nô",
  "thien di": "Di",
  "tat ach": "Tật",
  "tai bach": "Tài",
  "tu tuc": "Tử",
  "phu the": "Phu",
  "phu quan": "Phu",
  "huynh de": "H.Đệ",
};

function getPalaceId(palace: Pick<NormalizedPalace, "index" | "name" | "earthlyBranch">) {
  return `${palace.index}:${normalizeLookupKey(palace.name)}:${normalizeLookupKey(palace.earthlyBranch ?? "")}`;
}

function getPalaceStem(palace: Pick<NormalizedPalace, "heavenlyStem" | "palaceStem" | "earthlyBranch">, palaceStemMap?: Record<string, string>) {
  return palace.heavenlyStem || palace.palaceStem || (palace.earthlyBranch ? palaceStemMap?.[normalizeBranch(palace.earthlyBranch)] : undefined);
}

function getSourceStars(palace: Pick<NormalizedPalace, "majorStars" | "minorStars" | "adjectiveStars" | "extraStars">) {
  return [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars, ...palace.extraStars];
}

export function getPalaceShortName(name: string) {
  return PALACE_SHORT_NAMES[normalizeLookupKey(name)] ?? name;
}

export function findPalaceByOriginalStar(palaces: NormalizedPalace[], starName: string) {
  const normalizedTarget = normalizeLookupKey(normalizeStarName(starName));

  for (const palace of palaces) {
    const stars = getSourceStars(palace);
    const matchedStar = stars.find((star) => {
      if (!isOriginalNatalStar(star)) {
        return false;
      }

      return normalizeLookupKey(normalizeStarName(star.name)) === normalizedTarget;
    });

    if (matchedStar) {
      return {
        palace,
        star: matchedStar,
      };
    }
  }

  return null;
}

export function generatePhiTuHoaForPalace(sourcePalace: NormalizedPalace, palaces: NormalizedPalace[], palaceStemMap?: Record<string, string>) {
  const sourceStem = normalizeStem(getPalaceStem(sourcePalace, palaceStemMap));
  const sourcePalaceId = getPalaceId(sourcePalace);
  const tuHoa = TU_HOA_TABLE[sourceStem as keyof typeof TU_HOA_TABLE];

  if (!tuHoa) {
    return {
      flows: [],
      corner: {
        loc: null,
        ky: null,
      },
    } satisfies PhiResult;
  }

  const flows = (Object.keys(TU_HOA_LABELS) as PhiType[]).map((type) => {
    const targetStar = tuHoa[type];
    const found = findPalaceByOriginalStar(palaces, targetStar);

    if (!found) {
      return {
        sourcePalaceId,
        sourcePalaceName: sourcePalace.name,
        sourceStem,
        type,
        typeLabel: TU_HOA_LABELS[type],
        targetStar,
        targetPalaceId: null,
        targetPalaceName: null,
        targetPalaceShortName: null,
        relation: "missing_star",
        displayText: `${sourcePalace.name} phi ${TU_HOA_LABELS[type]} không tìm thấy sao ${targetStar}`,
      } satisfies PhiFlow;
    }

    const targetPalaceId = getPalaceId(found.palace);
    const relation = targetPalaceId === sourcePalaceId ? "tu_hoa" : "phi_nhap";
    const targetPalaceShortName = getPalaceShortName(found.palace.name);

    return {
      sourcePalaceId,
      sourcePalaceName: sourcePalace.name,
      sourceStem,
      type,
      typeLabel: TU_HOA_LABELS[type],
      targetStar,
      targetPalaceId,
      targetPalaceName: found.palace.name,
      targetPalaceShortName,
      relation,
      displayText:
        relation === "tu_hoa"
          ? `${sourcePalace.name} tự ${TU_HOA_LABELS[type]} tại ${targetStar}`
          : `${sourcePalace.name} phi ${TU_HOA_LABELS[type]} nhập ${found.palace.name} tại ${targetStar}`,
    } satisfies PhiFlow;
  });

  return {
    flows,
    corner: {
      loc: flows.find((flow) => flow.type === "loc")?.targetPalaceShortName ?? null,
      ky: flows.find((flow) => flow.type === "ky")?.targetPalaceShortName ?? null,
    },
  } satisfies PhiResult;
}

export function generatePhiTuHoaForChart(palaces: NormalizedPalace[], yearStem?: string) {
  const palaceStemMap = yearStem ? generatePalaceStems(yearStem) : undefined;

  return palaces.map((palace) => {
    const heavenlyStem = palace.heavenlyStem || palace.palaceStem || (palace.earthlyBranch ? palaceStemMap?.[normalizeBranch(palace.earthlyBranch)] : undefined);
    const phiTuHoa = generatePhiTuHoaForPalace(
      {
        ...palace,
        heavenlyStem,
        palaceStem: heavenlyStem,
      },
      palaces.map((candidate) => ({
        ...candidate,
        heavenlyStem:
          candidate.heavenlyStem ||
          candidate.palaceStem ||
          (candidate.earthlyBranch ? palaceStemMap?.[normalizeBranch(candidate.earthlyBranch)] : undefined),
      })),
      palaceStemMap,
    );

    return {
      ...palace,
      heavenlyStem,
      palaceStem: heavenlyStem,
      phiTuHoa,
      corner: phiTuHoa.corner,
    };
  });
}

export function buildPhiTuHoaDebugTable(palaces: Array<NormalizedPalace & { phiTuHoa?: PhiResult }>) {
  const lines = ["Cung | Can | Lộc nhập | Quyền nhập | Khoa nhập | Kỵ nhập"];

  for (const palace of palaces) {
    const flows = palace.phiTuHoa?.flows ?? [];
    const byType = Object.fromEntries(flows.map((flow) => [flow.type, flow]));
    const formatFlow = (flow?: PhiFlow) =>
      flow?.targetPalaceName ? `${flow.targetPalaceName}/${flow.targetStar}` : `missing/${flow?.targetStar ?? ""}`;

    lines.push(
      [
        palace.name,
        palace.heavenlyStem || palace.palaceStem || "",
        formatFlow(byType.loc),
        formatFlow(byType.quyen),
        formatFlow(byType.khoa),
        formatFlow(byType.ky),
      ].join(" | "),
    );
  }

  return lines.join("\n");
}

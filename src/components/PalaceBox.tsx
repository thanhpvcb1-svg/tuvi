import React from "react";
import type { PalaceView } from "../lib/types";
import StarText from "./StarText";

type PhiFlow = {
  type: "loc" | "quyen" | "khoa" | "ky";
  displayText: string;
  targetPalaceName?: string | null;
  targetPalaceShortName?: string | null;
  relation?: "phi_nhap" | "tu_hoa" | "missing_star";
};

const FLOW_ORDER: Array<PhiFlow["type"]> = ["loc", "quyen", "khoa", "ky"];

const FLOW_LABELS: Record<PhiFlow["type"], string> = {
  loc: "Hóa Lộc",
  quyen: "Hóa Quyền",
  khoa: "Hóa Khoa",
  ky: "Hóa Kỵ",
};

const normalizeFlowText = (flow: PhiFlow) => {
  const label = FLOW_LABELS[flow.type];
  const targetLabel = flow.targetPalaceName || flow.targetPalaceShortName;

  if (targetLabel) {
    return `${label} → ${targetLabel}`;
  }

  const cleaned = flow.displayText.trim();

  return `${label} → ${cleaned}`;
};

export default function PalaceBox({
  palace,
  index,
  showLocKyNhap = false,
  showPhiHoaCanCung = true,
}: {
  palace: PalaceView;
  index: number;
  showLocKyNhap?: boolean;
  showPhiHoaCanCung?: boolean;
}) {
  const extendedPalace = palace as PalaceView & {
    phiTuHoa?: {
      flows?: PhiFlow[];
    };
    corner?: {
      loc?: string | null;
      ky?: string | null;
    };
  };

  const phiHoaFlows = FLOW_ORDER
    .map((type) => extendedPalace.phiTuHoa?.flows?.find((flow) => flow.type === type))
    .filter((flow): flow is PhiFlow => Boolean(flow?.displayText?.trim()));

  const locFlow = extendedPalace.phiTuHoa?.flows?.find((flow) => flow.type === "loc");
  const kyFlow = extendedPalace.phiTuHoa?.flows?.find((flow) => flow.type === "ky");

  return (
    <section className="palace">
      {palace.specialMarkers.some((marker) => !marker.betweenPalaceIndexes) ? (
        <div className="palace-markers">
          {palace.specialMarkers
            .filter((marker) => !marker.betweenPalaceIndexes)
            .map((marker, markerIndex) => (
              <span key={`${marker.name}-${markerIndex}`} className="special-marker">
                {marker.name}
              </span>
            ))}
        </div>
      ) : null}

      <div className="palace-head">
        <span className="stem-branch">
          {palace.heavenlyStem || ""}
          {palace.earthlyBranch ? `.${palace.earthlyBranch}` : ""}
        </span>
        <span className="palace-title">
          {palace.name.toUpperCase()}
          {palace.isBodyPalace ? <strong className="body-badge">Thân</strong> : null}
        </span>
        <span className="decade">{palace.decadalRange || ""}</span>
      </div>

      <div className="major-stars">
        {(palace.centerStars ?? palace.majorStars).length > 0 ? (
          (palace.centerStars ?? palace.majorStars).map((star, starIndex) => <StarText key={starIndex} star={star} />)
        ) : (
          <div className="empty-major" aria-hidden="true" />
        )}
      </div>

      <div className="star-columns">
        <div className="col col-good">
          {(palace.leftStars ?? palace.goodStars).map((star, starIndex) => (
            <StarText key={starIndex} star={star} />
          ))}
        </div>
        <div className="col col-bad">
          {(palace.rightStars ?? palace.badStars).map((star, starIndex) => (
            <StarText key={starIndex} star={star} />
          ))}
        </div>
      </div>

      {showPhiHoaCanCung && phiHoaFlows.length > 0 ? (
        <div className="palace-phi-hoa" aria-label="Phi Hóa Can Cung">
          {phiHoaFlows.map((flow) => (
            <div key={flow.type} className="palace-phi-hoa-line">
              {normalizeFlowText(flow)}
            </div>
          ))}
        </div>
      ) : null}

      {showLocKyNhap && (extendedPalace.corner?.loc || extendedPalace.corner?.ky) ? (
        <div className="palace-corner" title={[locFlow?.displayText, kyFlow?.displayText].filter(Boolean).join("\n")}>
          <span>{`Lộc: ${extendedPalace.corner?.loc ?? "-"}`}</span>
          <span>{`Kỵ: ${extendedPalace.corner?.ky ?? "-"}`}</span>
        </div>
      ) : null}

      <div className="palace-footer">
        <span>{palace.bottomLeft || palace.earthlyBranch || ""}</span>
        <span>{palace.bottomCenter || "Trạng thái"}</span>
        <span>{palace.bottomRight || `T.${index + 1}`}</span>
      </div>
    </section>
  );
}

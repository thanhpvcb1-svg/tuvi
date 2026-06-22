import React from "react";
import type { PalaceView } from "../lib/types";
import StarText from "./StarText";

export default function PalaceBox({
  palace,
  index,
  showLocKyNhap = false,
}: {
  palace: PalaceView;
  index: number;
  showLocKyNhap?: boolean;
}) {
  const extendedPalace = palace as PalaceView & {
    phiTuHoa?: {
      flows?: Array<{ type: "loc" | "quyen" | "khoa" | "ky"; displayText: string }>;
    };
    corner?: {
      loc?: string | null;
      ky?: string | null;
    };
  };
  const locFlow = extendedPalace.phiTuHoa?.flows?.find((flow) => flow.type === "loc");
  const kyFlow = extendedPalace.phiTuHoa?.flows?.find((flow) => flow.type === "ky");

  return (
    <section className="palace">
      {palace.specialMarkers.some((m) => !m.betweenPalaceIndexes) ? (
        <div className="palace-markers">
          {palace.specialMarkers
            .filter((m) => !m.betweenPalaceIndexes)
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

import React from "react";
import type { ChartView, PalaceView } from "../lib/types";
import ChartCenter from "./ChartCenter";
import PalaceBox from "./PalaceBox";

const chartSlots: Array<string | null> = [
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Thìn",
  null,
  null,
  "Dậu",
  "Mão",
  null,
  null,
  "Tuất",
  "Dần",
  "Sửu",
  "Tý",
  "Hợi",
];

const branchToSlot = new Map(
  chartSlots
    .map((branch, index) => (branch ? [branch, index] : null))
    .filter(Boolean) as Array<[string, number]>,
);

const fallbackPalace = (index: number): PalaceView => ({
  index,
  name: `Cung ${index + 1}`,
  isBodyPalace: false,
  ages: [],
  majorStars: [],
  minorStars: [],
  adjectiveStars: [],
  specialStars: [],
  centerStars: [],
  leftStars: [],
  rightStars: [],
  bottomStars: [],
  specialMarkers: [],
  goodStars: [],
  badStars: [],
  displayStars: [],
  analysisStars: [],
  visibleStars: [],
});

type Props = {
  chart: ChartView | null;
  hasRequestedChart: boolean;
  activePalaceIndexes?: { daiVan?: number; tieuVan?: number };
  showLocKyNhap?: boolean;
  showPhiHoaCanCung?: boolean;
  showTieuVanHighlight?: boolean;
};

function getCellCenter(slotIndex: number) {
  const column = slotIndex % 4;
  const row = Math.floor(slotIndex / 4);

  return {
    x: column * 256 + 128,
    y: row * 360 + 180,
  };
}

function getCellRect(slotIndex: number) {
  const column = slotIndex % 4;
  const row = Math.floor(slotIndex / 4);
  const left = column * 256;
  const top = row * 360;

  return {
    left,
    top,
    right: left + 256,
    bottom: top + 360,
    column,
    row,
  };
}

function getInnerEdgeAnchor(slotIndex: number) {
  const rect = getCellRect(slotIndex);
  const centerRect = {
    left: 256,
    top: 360,
    right: 768,
    bottom: 1080,
  };

  if (rect.right === centerRect.left && rect.bottom === centerRect.top) {
    return { x: rect.right, y: rect.bottom };
  }

  if (rect.left === centerRect.right && rect.bottom === centerRect.top) {
    return { x: rect.left, y: rect.bottom };
  }

  if (rect.right === centerRect.left && rect.top === centerRect.bottom) {
    return { x: rect.right, y: rect.top };
  }

  if (rect.left === centerRect.right && rect.top === centerRect.bottom) {
    return { x: rect.left, y: rect.top };
  }

  if (rect.row === 0) {
    return { x: rect.left + 128, y: rect.bottom };
  }

  if (rect.row === 3) {
    return { x: rect.left + 128, y: rect.top };
  }

  if (rect.column === 0) {
    return { x: rect.right, y: rect.top + 180 };
  }

  if (rect.column === 3) {
    return { x: rect.left, y: rect.top + 180 };
  }

  return getCellCenter(slotIndex);
}

function getBorderBadgePosition(slotA: number, slotB: number): { x: number; y: number } | null {
  const colA = slotA % 4;
  const rowA = Math.floor(slotA / 4);
  const colB = slotB % 4;
  const rowB = Math.floor(slotB / 4);

  if (rowA === rowB && Math.abs(colA - colB) === 1) {
    // Same row — badge on the inner horizontal edge (bottom of row 0, top of row 3)
    const x = Math.max(colA, colB) * 256;
    const y = rowA === 0 ? (rowA + 1) * 360 : rowA * 360;
    return { x, y };
  }
  if (colA === colB && Math.abs(rowA - rowB) === 1) {
    // Same column — badge centered in the column at the shared horizontal border
    const y = Math.max(rowA, rowB) * 360;
    const x = colA * 256 + 128;
    return { x, y };
  }
  return null;
}

export default function TuviChart({
  chart,
  hasRequestedChart,
  activePalaceIndexes,
  showLocKyNhap = false,
  showPhiHoaCanCung = true,
  showTieuVanHighlight = true,
}: Props) {
  if (!hasRequestedChart) {
    return (
      <section className="chart chart-empty chart-welcome">
        <div className="chart-message">
          <p className="chart-kicker">Sẵn sàng lập số</p>
          <h2>Lá số sẽ xuất hiện sau khi bạn bấm &quot;Lấy lá số&quot;</h2>
          <p>Hệ thống sẽ an sao từ dữ liệu sinh và dựng lá số 12 cung ngay bên dưới.</p>
        </div>
      </section>
    );
  }

  if (!chart || chart.palaces.length === 0) {
    return (
      <section className="chart chart-empty">
        <div className="note">Không đọc được dữ liệu 12 cung từ iztro. Vui lòng kiểm tra raw data.</div>
      </section>
    );
  }

  const palacesBySlot = new Map<number, PalaceView>();
  const palaceIndexToSlot = new Map<number, number>();
  chart.palaces.forEach((palace) => {
    const slotIndex = palace.earthlyBranch ? branchToSlot.get(palace.earthlyBranch.trim()) : undefined;
    if (slotIndex !== undefined) {
      palacesBySlot.set(slotIndex, palace);
      palaceIndexToSlot.set(palace.index, slotIndex);
    }
  });

  // Collect unique border markers; merge Tuần+Triệt at same position into "Tuần/Triệt"
  const borderMarkerMap = new Map<string, { names: Set<string>; x: number; y: number }>();
  const seenBorderKeys = new Set<string>();
  for (const palace of chart.palaces) {
    for (const marker of palace.specialMarkers) {
      if (!marker.betweenPalaceIndexes) continue;
      const [piA, piB] = marker.betweenPalaceIndexes;
      const key = `${marker.name}:${Math.min(piA, piB)}-${Math.max(piA, piB)}`;
      if (seenBorderKeys.has(key)) continue;
      seenBorderKeys.add(key);
      const slotA = palaceIndexToSlot.get(piA);
      const slotB = palaceIndexToSlot.get(piB);
      if (slotA === undefined || slotB === undefined) continue;
      const pos = getBorderBadgePosition(slotA, slotB);
      if (!pos) continue;
      const posKey = `${pos.x}:${pos.y}`;
      const existing = borderMarkerMap.get(posKey);
      if (existing) {
        existing.names.add(marker.name);
      } else {
        borderMarkerMap.set(posKey, { names: new Set([marker.name]), x: pos.x, y: pos.y });
      }
    }
  }
  const borderMarkers = Array.from(borderMarkerMap.values()).map((entry) => ({
    name: ["Tuần", "Triệt"].filter((n) => entry.names.has(n)).join("/") || [...entry.names].join("/"),
    x: entry.x,
    y: entry.y,
  }));

  const menhEntry = Array.from(palacesBySlot.entries()).find(([, palace]) => palace.name === "Mệnh");
  const projectedLines =
    menhEntry === undefined
      ? []
      : Array.from(palacesBySlot.entries())
          .filter(([, palace]) => ["Thiên Di", "Tài Bạch", "Quan Lộc"].includes(palace.name))
          .map(([slotIndex, palace]) => {
            const from = getInnerEdgeAnchor(menhEntry[0]);
            const to = getInnerEdgeAnchor(slotIndex);
            return { name: palace.name, x1: from.x, y1: from.y, x2: to.x, y2: to.y };
          });

  return (
    <section className="chart">
      <div className="chart-export-frame">
        <div className="chart-export-content">
          <div className="chart-grid">
            {borderMarkers.map((bm, i) => (
              <span
                key={`border-marker-${i}`}
                className="special-marker"
                style={{
                  position: "absolute",
                  left: bm.x,
                  top: bm.y,
                  transform: "translate(-50%, -50%)",
                  zIndex: 10,
                  pointerEvents: "none",
                }}
              >
                {bm.name}
              </span>
            ))}
            {chartSlots.map((branch, index) => {
              if (branch === null) {
                return index === 5 ? (
                  <div key={index} className="center-slot">
                    <ChartCenter chart={chart} />
                  </div>
                ) : null;
              }

              const palace = palacesBySlot.get(index);
              const palaceIdx = palace?.index;
              const isTieuVan = showTieuVanHighlight && palaceIdx !== undefined && palaceIdx === activePalaceIndexes?.tieuVan;
              const cellClass = ["grid-cell", isTieuVan ? "grid-cell--tieu-van" : ""]
                .filter(Boolean).join(" ");
              return (
                <div key={index} className={cellClass}>
                  <PalaceBox
                    palace={palace ?? fallbackPalace(index)}
                    index={palace?.index ?? index}
                    showLocKyNhap={showLocKyNhap}
                    showPhiHoaCanCung={showPhiHoaCanCung}
                  />
                </div>
              );
            })}
          </div>
          <div className="chart-legend">
            <span>M: Miếu</span>
            <span>V: Vượng</span>
            <span>Đ: Đắc</span>
            <span>B: Bình hòa</span>
            <span>L: Lợi</span>
            <span>H: Hãm</span>
            <span className="element kim">Kim</span>
            <span className="element moc">Mộc</span>
            <span className="element thuy">Thủy</span>
            <span className="element hoa">Hỏa</span>
            <span className="element tho">Thổ</span>
          </div>
          {projectedLines.length ? (
            <svg className="chart-web-lines" viewBox="0 0 1024 1440" preserveAspectRatio="none">
              {projectedLines.map((line) => (
                <line
                  key={line.name}
                  x1={line.x1 + 6}
                  y1={line.y1 + 6}
                  x2={line.x2 + 6}
                  y2={line.y2 + 6}
                  className="focus-line"
                  stroke="rgba(156, 99, 99, 0.42)"
                  strokeWidth="1.05"
                  strokeLinecap="round"
                />
              ))}
            </svg>
          ) : null}
        </div>
      </div>
    </section>
  );
}

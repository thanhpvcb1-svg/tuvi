import React from "react";
import type { ChartView, PalaceView } from "../lib/types";

// ── Đại vận engine ──────────────────────────────────────────────

const BRANCHES = [
  "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ",
  "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi",
] as const;

const CUC_START_AGE: Record<string, number> = {
  "Thủy Nhị Cục": 2,
  "Mộc Tam Cục": 3,
  "Kim Tứ Cục": 4,
  "Thổ Ngũ Cục": 5,
  "Hỏa Lục Cục": 6,
};

function branchMod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function shiftBranch(branch: string, step: number): string {
  const index = BRANCHES.indexOf(branch as (typeof BRANCHES)[number]);
  if (index < 0) return branch;
  return BRANCHES[branchMod(index + step, BRANCHES.length)];
}

function getDirection(yinYangLabel: string | undefined): "forward" | "backward" {
  if (!yinYangLabel) return "forward";
  const duongNam = yinYangLabel.includes("Dương") && yinYangLabel.includes("Nam");
  const amNu = yinYangLabel.includes("Âm") && yinYangLabel.includes("Nữ");
  return duongNam || amNu ? "forward" : "backward";
}

type DaVanPeriod = { branch: string; fromAge: number; toAge: number; label: string };

function buildDaVan(menhBranch: string, cucName: string, direction: "forward" | "backward"): DaVanPeriod[] {
  const startAge = CUC_START_AGE[cucName];
  if (!startAge) return [];
  const step = direction === "forward" ? 1 : -1;
  return Array.from({ length: 12 }, (_, i) => {
    const branch = shiftBranch(menhBranch, i * step);
    const fromAge = startAge + i * 10;
    return { branch, fromAge, toAge: fromAge + 9, label: `${fromAge}–${fromAge + 9}` };
  });
}

// ── Active palace resolver ───────────────────────────────────────

export type ActivePalaceResult = {
  daiVan?: number;
  daiVanLabel?: string;
  tieuVan?: number;
};

export function getActivePalaceIndexes(
  palaces: PalaceView[],
  age: number,
  menhBranch?: string,
  cucName?: string,
  yinYangLabel?: string,
): ActivePalaceResult {
  let daiVan: number | undefined;
  let daiVanLabel: string | undefined;
  let tieuVan: number | undefined;

  if (menhBranch && cucName) {
    const direction = getDirection(yinYangLabel);
    const periods = buildDaVan(menhBranch, cucName, direction);
    const active = periods.find((p) => age >= p.fromAge && age <= p.toAge);
    if (active) {
      const palace = palaces.find((p) => p.earthlyBranch === active.branch);
      if (palace) {
        daiVan = palace.index;
        daiVanLabel = active.label;
      }
    }
  }

  for (const palace of palaces) {
    if (Array.isArray(palace.ages) && palace.ages.includes(age)) {
      tieuVan = palace.index;
    }
  }

  return { daiVan, daiVanLabel, tieuVan };
}

// ── Component ────────────────────────────────────────────────────

type Props = {
  year: number;
  birthYear: number;
  chart: ChartView;
  onChange: (year: number) => void;
};

export default function VanHanhSelector({ year, birthYear, chart, onChange }: Props) {
  const age = year - birthYear;
  const palaces = chart.palaces;
  const menhBranch = palaces.find((p) => p.name === "Mệnh")?.earthlyBranch;
  const cucName = chart.profile.fiveElementsClass;
  const yinYangLabel = chart.profile.yinYangLabel;

  const { daiVan: daiVanIdx, daiVanLabel, tieuVan: tieuVanIdx } = getActivePalaceIndexes(
    palaces, age, menhBranch, cucName, yinYangLabel,
  );
  const daiVanPalace = palaces.find((p) => p.index === daiVanIdx);
  const tieuVanPalace = palaces.find((p) => p.index === tieuVanIdx);

  return (
    <div className="van-hanh-bar">
      <div className="van-hanh-controls">
        <button className="van-year-btn" onClick={() => onChange(year - 1)}>←</button>
        <input
          className="van-year-input"
          type="number"
          value={year}
          min={1900}
          max={2100}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v) && v >= 1900 && v <= 2100) onChange(v);
          }}
        />
        <button className="van-year-btn" onClick={() => onChange(year + 1)}>→</button>
        <span className="van-age">Tuổi {age}</span>
      </div>

      <div className="van-hanh-info">
        {daiVanPalace ? (
          <span className="van-tag van-tag--dai">
            Đại vận {daiVanLabel} · <strong>{daiVanPalace.name}</strong>
          </span>
        ) : (
          <span className="van-tag van-tag--none">Ngoài đại vận</span>
        )}
        {tieuVanPalace ? (
          <span className="van-tag van-tag--tieu">
            Tiểu vận · <strong>{tieuVanPalace.name}</strong>
          </span>
        ) : null}
      </div>
    </div>
  );
}

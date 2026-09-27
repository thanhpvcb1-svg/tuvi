import React, { useEffect, useMemo, useState } from "react";
import type { ChartView } from "../lib/types";
import { isKnowledgeReady, loadKnowledge, queryPalaceKnowledge } from "../lib/tuvi/knowledge/lazyKnowledgeService";

/**
 * "Cơ sở tri thức" - liệt kê các đoạn tri thức đã khớp với lá số theo từng cung, kèm lý do khớp.
 * Dùng đúng queryPalaceKnowledge như phần luận giải nên hai phần không thể lệch nhau.
 * Không hiển thị tên nguồn (quyết định không công khai nguồn lấy tri thức).
 */

const PALACES = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"];
const EXCERPT_LENGTH = 180;

type Props = {
  chart: ChartView;
  yearToView?: number;
  birthYear?: number;
};

export default function EvidencePanel({ chart, yearToView, birthYear }: Props) {
  const [ready, setReady] = useState(isKnowledgeReady());

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    loadKnowledge()
      .then(() => !cancelled && setReady(true))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [ready]);

  const rows = useMemo(() => {
    if (!ready) return [];
    return PALACES.map((name) => {
      const palace = chart.palaces.find((p) => p.name === name);
      if (!palace) return null;
      const matches = queryPalaceKnowledge({
        chart,
        palace: palace as any,
        starsInPalace: [],
        branch: palace.earthlyBranch ?? "",
        yearToView,
        birthYear,
      });
      return { name, branch: palace.earthlyBranch, isBody: palace.isBodyPalace, matches };
    }).filter((row): row is NonNullable<typeof row> => row !== null);
  }, [ready, chart, yearToView, birthYear]);

  if (!ready) {
    return (
      <p className="demo-note" aria-busy="true">
        Đang tải kho tri thức…
      </p>
    );
  }

  return (
    <div className="evidence-panel">
      {rows.map((row) => (
        <details key={row.name} className="evidence-palace">
          <summary>
            <span className="evidence-palace__name">
              Cung {row.name} ({row.branch}){row.isBody ? " · Thân" : ""}
            </span>
            <span className="evidence-palace__count">
              {row.matches.length ? `${row.matches.length} đoạn tri thức khớp` : "Không có đoạn tri thức khớp"}
            </span>
          </summary>
          {row.matches.length ? (
            <ol className="evidence-list">
              {row.matches.map((match) => {
                const text = match.interpretation.text.replace(/\s+/g, " ").trim();
                return (
                  <li key={match.interpretation.id}>
                    <p className="evidence-list__text">
                      {match.interpretation.type === "period" ? <span className="support-chip">Vận hạn {yearToView}</span> : null}
                      {text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH)}…` : text}
                    </p>
                    <p className="evidence-list__reason">
                      <strong>Lý do khớp:</strong> {match.matchReasons.join(" · ")}
                      {match.trimmedSentences ? ` · Đã lược ${match.trimmedSentences} câu không áp dụng cho lá số này` : ""}
                    </p>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="demo-note">Không có đoạn tri thức nào thỏa đủ điều kiện với cung này - hệ thống để trống thay vì suy đoán.</p>
          )}
        </details>
      ))}
    </div>
  );
}

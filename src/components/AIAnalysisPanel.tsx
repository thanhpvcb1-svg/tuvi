import React from "react";
import type { AIAnalysisResult } from "../lib/aiLuanGiai";

type Props = {
  result: AIAnalysisResult | null;
  isLoading: boolean;
  error: string;
  analysisData: string;
  onRegenerate: () => void;
  remainingQuota: number;
  hasLimitedBacPhaiData: boolean;
};

function TextSection({ title, content }: { title: string; content: string }) {
  if (!content.trim()) {
    return null;
  }

  return (
    <article className="ai-analysis-card">
      <h4>{title}</h4>
      <p>{content}</p>
    </article>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <article className="ai-analysis-card">
      <h4>{title}</h4>
      <ul className="ai-analysis-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function TuHoaNamSinhSection({ result }: { result: AIAnalysisResult }) {
  const items = [
    { label: "Hóa Lộc", value: result.tuHoaNamSinh.hoaLoc },
    { label: "Hóa Quyền", value: result.tuHoaNamSinh.hoaQuyen },
    { label: "Hóa Khoa", value: result.tuHoaNamSinh.hoaKhoa },
    { label: "Hóa Kỵ", value: result.tuHoaNamSinh.hoaKy },
  ].filter((item) => item.value.trim());

  if (items.length === 0) {
    return null;
  }

  return (
    <article className="ai-analysis-card">
      <h4>Tứ Hóa năm sinh</h4>
      <div className="ai-analysis-stack">
        {items.map((item) => (
          <div key={item.label}>
            <strong>{item.label}</strong>
            <p>{item.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function PhiHoaSection({ result }: { result: AIAnalysisResult }) {
  if (result.phiHoaCanCung.length === 0) {
    return null;
  }

  return (
    <article className="ai-analysis-card">
      <h4>Phi Hóa Can Cung</h4>
      <div className="ai-analysis-stack">
        {result.phiHoaCanCung.map((item, index) => (
          <div key={`${item.fromPalace}-${item.toPalace}-${item.transformation}-${index}`}>
            <strong>{item.fromPalace} → {item.toPalace} · {item.transformation}</strong>
            <p>{item.analysis}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function TuHoaSection({ result }: { result: AIAnalysisResult }) {
  if (result.tuHoa.length === 0) {
    return null;
  }

  return (
    <article className="ai-analysis-card">
      <h4>Tự Hóa</h4>
      <div className="ai-analysis-stack">
        {result.tuHoa.map((item, index) => (
          <div key={`${item.palace}-${item.transformation}-${index}`}>
            <strong>{item.palace} · {item.transformation}</strong>
            <p>{item.analysis}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function AIAnalysisPanel({
  result,
  isLoading,
  error,
  analysisData,
  onRegenerate,
  remainingQuota,
  hasLimitedBacPhaiData,
}: Props) {
  return (
    <section className="reading-panel ai-analysis-panel">
      <div className="reading-header ai-analysis-head">
        <div>
          <h3>Luận giải lá số bằng AI</h3>
          <p>
            Phần luận giải AI bên dưới ưu tiên góc nhìn Bắc Phái: xem dòng Phi Hóa giữa các cung, Tứ Hóa, can cung,
            Đại Vận, Lưu Niên và các điểm kích hoạt như Thái Tuế Nhập Quái nếu lá số có đủ dữ liệu.
          </p>
        </div>
        <button type="button" className="ghost-button ai-analysis-refresh" onClick={onRegenerate} disabled={isLoading || remainingQuota <= 0}>
          Tạo lại luận giải
        </button>
      </div>

      <div className="ai-analysis-meta">
        <span className="inline-pill">Bắc Phái</span>
        <span className="inline-pill">Còn {remainingQuota}/3 lượt tạo mới hôm nay</span>
      </div>

      {hasLimitedBacPhaiData ? (
        <div className="ai-analysis-warning">
          Lá số hiện chưa có đủ dữ liệu Phi Hóa/Can Cung, phần luận giải Bắc Phái có thể bị giới hạn.
        </div>
      ) : null}

      {analysisData ? (
        <details className="reading-data-card">
          <summary>Dữ liệu lá số gửi cho AI</summary>
          <pre className="reading-data-json">{analysisData}</pre>
        </details>
      ) : null}

      {isLoading ? <div className="reading-status">Đang phân tích Tứ Hóa, Phi Hóa và vận hạn...</div> : null}
      {!isLoading && error ? <div className="reading-error">{error}</div> : null}
      {!isLoading && !error && !result ? <div className="reading-status">Bấm “Luận giải Bắc Phái bằng AI” để tạo phần diễn giải từ lá số hiện tại.</div> : null}

      {result ? (
        <div className="ai-analysis-grid">
          <TextSection title="Tổng quan mệnh cục" content={result.tongQuanMenhCuc} />
          <TextSection title="Mệnh – Thân" content={result.luanMenhThan} />
          <TextSection title="Trọng tâm Bắc Phái" content={result.trongTamBacPhai} />
          <TuHoaNamSinhSection result={result} />
          <PhiHoaSection result={result} />
          <TuHoaSection result={result} />
          <TextSection title="Thái Tuế Nhập Quái" content={result.thaiTueNhapQuai} />
          <TextSection title="Đại Vận" content={result.daiVan} />
          <TextSection title="Lưu Niên" content={result.luuNien} />
          <TextSection title="Sự nghiệp – Tài lộc" content={result.suNghiepTaiLoc} />
          <TextSection title="Tình duyên – Gia đạo" content={result.tinhDuyenGiaDao} />
          <ListSection title="Điểm mạnh" items={result.diemManh} />
          <ListSection title="Điểm cần lưu ý" items={result.diemCanLuuY} />
          <ListSection title="Gợi ý hành động" items={result.goiYHanhDong} />
          <TextSection title="Disclaimer" content={result.disclaimer} />
        </div>
      ) : null}
    </section>
  );
}

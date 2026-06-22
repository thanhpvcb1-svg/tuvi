import React from "react";

type Props = {
  result: string;
  isLoading: boolean;
  error: string;
  analysisData: string;
};

export default function ChartReading({ result, isLoading, error, analysisData }: Props) {
  return (
    <section className="reading-panel">
      <div className="reading-header">
        <h3>Luận giải lá số</h3>
        <p>Nội dung được tạo từ dữ liệu lá số hiện tại và chỉ dùng để tham khảo.</p>
      </div>

      {analysisData ? (
        <details className="reading-data-card">
          <summary>Dữ liệu kỹ thuật dùng cho luận giải</summary>
          <pre className="reading-data-json">{analysisData}</pre>
        </details>
      ) : null}

      {isLoading ? <div className="reading-status">Đang luận giải...</div> : null}
      {error ? <div className="reading-error">{error}</div> : null}
      {result ? <div className="reading-result">{result}</div> : null}
    </section>
  );
}

import React, { useState, useCallback } from "react";
import { parseQuickInput, formatParsedData, type ParseResult, type ParsedBirthData } from "../lib/quickInputParser";
import type { BirthInput } from "../lib/types";

type Props = {
  currentValues: BirthInput;
  onFill: (values: Partial<BirthInput>) => void;
  onSubmit?: (values: BirthInput) => void;
};

const isCompleteBirthData = (data: ParsedBirthData): boolean => {
  return Boolean(
    data.day &&
    data.month &&
    data.year &&
    data.gender &&
    data.birthHour
  );
};

type ConflictField = {
  field: string;
  label: string;
  current: string;
  new: string;
};

export default function QuickInputSection({ currentValues, onFill, onSubmit }: Props) {
  const [inputText, setInputText] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [conflicts, setConflicts] = useState<ConflictField[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingData, setPendingData] = useState<ParsedBirthData | null>(null);

  const handleParse = useCallback(() => {
    if (!inputText.trim()) {
      setParseResult(null);
      return;
    }

    const result = parseQuickInput(inputText);
    setParseResult(result);
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleParse();
    }
  };

  const detectConflicts = (data: ParsedBirthData): ConflictField[] => {
    const conflicts: ConflictField[] = [];
    
    const hasExistingData = (field: keyof BirthInput) => {
      const value = currentValues[field];
      return value !== undefined && value !== "" && value !== null;
    };

    if (data.fullName && hasExistingData("fullName") && data.fullName !== currentValues.fullName) {
      conflicts.push({
        field: "fullName",
        label: "Họ tên",
        current: currentValues.fullName,
        new: data.fullName,
      });
    }

    if (data.day && hasExistingData("day") && data.day !== currentValues.day) {
      const currentDate = `${currentValues.day}/${currentValues.month}/${currentValues.year}`;
      const newDate = `${data.day}/${data.month}/${data.year}`;
      conflicts.push({
        field: "date",
        label: "Ngày sinh",
        current: currentDate,
        new: newDate,
      });
    }

    if (data.gender && hasExistingData("gender") && data.gender !== currentValues.gender) {
      conflicts.push({
        field: "gender",
        label: "Giới tính",
        current: currentValues.gender === "male" ? "Nam" : "Nữ",
        new: data.gender === "male" ? "Nam" : "Nữ",
      });
    }

    if (data.birthHour && hasExistingData("birthHour") && data.birthHour !== currentValues.birthHour) {
      const currentTime = `${currentValues.birthHour}:${currentValues.birthMinute || "00"}`;
      const newTime = `${data.birthHour}:${data.birthMinute || "00"}`;
      conflicts.push({
        field: "time",
        label: "Giờ sinh",
        current: currentTime,
        new: newTime,
      });
    }

    return conflicts;
  };

  const handleFillClick = () => {
    if (!parseResult?.data) return;

    const detectedConflicts = detectConflicts(parseResult.data);
    
    if (detectedConflicts.length > 0) {
      setConflicts(detectedConflicts);
      setPendingData(parseResult.data);
      setShowConflictDialog(true);
    } else {
      applyData(parseResult.data);
    }
  };

  const applyData = (data: ParsedBirthData, shouldSubmit = false) => {
    const values: Partial<BirthInput> = {};
    
    if (data.fullName) values.fullName = data.fullName;
    if (data.day) values.day = data.day;
    if (data.month) values.month = data.month;
    if (data.year) values.year = data.year;
    if (data.gender) values.gender = data.gender;
    if (data.birthHour) values.birthHour = data.birthHour;
    if (data.birthMinute) values.birthMinute = data.birthMinute;
    
    // Use detected calendar type or default to solar
    values.calendarType = data.calendarType || "solar";

    onFill(values);
    setShowConflictDialog(false);
    setConflicts([]);
    setPendingData(null);

    if (shouldSubmit && onSubmit && isCompleteBirthData(data)) {
      const fullInput: BirthInput = {
        ...currentValues,
        ...values,
        fullName: data.fullName || currentValues.fullName || "Lá số",
        horoscopeYear: currentValues.horoscopeYear || String(new Date().getFullYear()),
        unknownBirthTime: false,
      } as BirthInput;
      
      setTimeout(() => onSubmit(fullInput), 50);
    }
  };

  const handleConflictResolve = (useNew: boolean, shouldSubmit = false) => {
    if (useNew && pendingData) {
      applyData(pendingData, shouldSubmit);
    }
    setShowConflictDialog(false);
    setConflicts([]);
    setPendingData(null);
  };

  const handleSubmitClick = () => {
    if (!parseResult?.data) return;

    const detectedConflicts = detectConflicts(parseResult.data);
    
    if (detectedConflicts.length > 0) {
      setConflicts(detectedConflicts);
      setPendingData(parseResult.data);
      setShowConflictDialog(true);
    } else {
      applyData(parseResult.data, true);
    }
  };

  const renderPreviewPills = (data: ParsedBirthData) => {
    const pills: Array<{ label: string; value: string }> = [];
    
    if (data.fullName) {
      pills.push({ label: "Họ tên", value: data.fullName });
    }
    if (data.day && data.month && data.year) {
      pills.push({ label: "Ngày sinh", value: `${data.day}/${data.month}/${data.year}` });
    }
    if (data.gender) {
      pills.push({ label: "Giới tính", value: data.gender === "male" ? "Nam" : "Nữ" });
    }
    if (data.birthHour) {
      const minute = data.birthMinute || "00";
      pills.push({ label: "Giờ sinh", value: `${data.birthHour}:${minute.padStart(2, "0")}` });
    }
    if (data.calendarType) {
      pills.push({ label: "Loại lịch", value: data.calendarType === "lunar" ? "Âm lịch" : "Dương lịch" });
    }

    return (
      <div className="quick-input-pills" role="list" aria-label="Thông tin đã nhận diện">
        {pills.map((pill, index) => (
          <span key={index} className="quick-input-pill" role="listitem">
            <span className="quick-input-pill-label">{pill.label}:</span>
            <span className="quick-input-pill-value">{pill.value}</span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="quick-input-section">
      <div className="quick-input-header">
        <span className="quick-input-icon">✨</span>
        <span className="quick-input-title">Nhập nhanh</span>
      </div>

      <p className="quick-input-hint">
        Ví dụ: Anh, 25-10-1997 06:30, nam dương lịch
      </p>

      <div className="quick-input-row">
        <input
          type="text"
          className="quick-input-field"
          placeholder="Nhập thông tin sinh..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Nhập nhanh thông tin sinh"
        />
        <button
          type="button"
          className="quick-input-button"
          onClick={handleParse}
          disabled={!inputText.trim()}
          aria-label="Tự động điền thông tin"
        >
          Tự động điền
        </button>
      </div>

      {/* Parse Result */}
      {parseResult && (
        <div className="quick-input-result">
          {/* Success */}
          {parseResult.success && (
            <div className="quick-input-success" role="status" aria-live="polite">
              <div className="quick-input-status">
                <span className="quick-input-status-icon">✓</span>
                <span className="quick-input-status-text">
                  {parseResult.partial 
                    ? "Đã nhận diện (thiếu giờ sinh)" 
                    : "Đã nhận diện thông tin"}
                </span>
              </div>
              {renderPreviewPills(parseResult.data)}
              {onSubmit && isCompleteBirthData(parseResult.data) ? (
                <button
                  type="button"
                  className="quick-input-fill-button quick-input-fill-button--primary"
                  onClick={handleSubmitClick}
                >
                  Lập lá số ngay →
                </button>
              ) : (
                <button
                  type="button"
                  className="quick-input-fill-button"
                  onClick={handleFillClick}
                >
                  Điền vào biểu mẫu →
                </button>
              )}
            </div>
          )}

          {/* Partial - has some data but missing required fields */}
          {!parseResult.success && parseResult.partial && (
            <div className="quick-input-warning" role="status" aria-live="polite">
              <div className="quick-input-status quick-input-status--warning">
                <span className="quick-input-status-icon">⚠</span>
                <span className="quick-input-status-text">
                  Nhận diện một phần thông tin
                </span>
              </div>
              {Object.keys(parseResult.data).length > 0 && renderPreviewPills(parseResult.data)}
              {parseResult.missing.length > 0 && (
                <p className="quick-input-missing">
                  Thiếu: {parseResult.missing.join(", ")}
                </p>
              )}
              {Object.keys(parseResult.data).length > 0 && (
                <button
                  type="button"
                  className="quick-input-fill-button quick-input-fill-button--secondary"
                  onClick={handleFillClick}
                >
                  Điền phần đã nhận diện →
                </button>
              )}
            </div>
          )}

          {/* Error */}
          {!parseResult.success && !parseResult.partial && (
            <div className="quick-input-error" role="alert" aria-live="assertive">
              <span className="quick-input-status-icon">✗</span>
              <span className="quick-input-error-text">
                {parseResult.errors[0] || "Không nhận diện được thông tin"}
              </span>
              <p className="quick-input-error-hint">
                Vui lòng kiểm tra lại định dạng. Ví dụ: Tên, DD-MM-YYYY HH:MM, nam/nữ
              </p>
            </div>
          )}
        </div>
      )}

      {/* Conflict Dialog */}
      {showConflictDialog && conflicts.length > 0 && (
        <div className="quick-input-conflict">
          <div className="quick-input-conflict-header">
            <span className="quick-input-status-icon">⚠</span>
            <span>Thông tin nhập nhanh khác với thông tin hiện tại</span>
          </div>
          
          <div className="quick-input-conflict-list">
            {conflicts.map((conflict, index) => (
              <div key={index} className="quick-input-conflict-item">
                <span className="quick-input-conflict-label">{conflict.label}</span>
                <div className="quick-input-conflict-values">
                  <span className="quick-input-conflict-current">
                    Hiện tại: <strong>{conflict.current}</strong>
                  </span>
                  <span className="quick-input-conflict-new">
                    Nhập nhanh: <strong>{conflict.new}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="quick-input-conflict-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => handleConflictResolve(false)}
            >
              Giữ thông tin cũ
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => handleConflictResolve(true, onSubmit && pendingData ? isCompleteBirthData(pendingData) : false)}
            >
              {onSubmit && pendingData && isCompleteBirthData(pendingData) ? "Dùng thông tin mới & Lập lá số" : "Dùng thông tin mới"}
            </button>
          </div>
        </div>
      )}

      <div className="quick-input-divider">
        <span>hoặc nhập thủ công</span>
      </div>
    </div>
  );
}

import React from "react";
import type { BirthInput, Gender } from "../lib/types";

type FormErrors = Partial<Record<keyof BirthInput, string>> & { form?: string };

type Props = {
  value: BirthInput;
  onChange: (value: BirthInput) => void;
  onSubmit: () => void;
  canPrint: boolean;
  fieldErrors: FormErrors;
  isSubmitting: boolean;
  hasDirtyChanges: boolean;
};

const onlyDigits = (value: string) => value.replace(/[^\d]/g, "");

const clampNumberInput = (value: string, maxDigits: number, max: number) => {
  const digits = onlyDigits(value).slice(0, maxDigits);
  if (!digits) return "";
  const parsed = Number(digits);
  if (Number.isNaN(parsed)) return "";
  return String(Math.min(parsed, max));
};

const BIRTH_HOURS = [
  { value: "0", label: "Giờ Tý (23h-1h)" },
  { value: "1", label: "Giờ Sửu (1h-3h)" },
  { value: "3", label: "Giờ Dần (3h-5h)" },
  { value: "5", label: "Giờ Mão (5h-7h)" },
  { value: "7", label: "Giờ Thìn (7h-9h)" },
  { value: "9", label: "Giờ Tỵ (9h-11h)" },
  { value: "11", label: "Giờ Ngọ (11h-13h)" },
  { value: "13", label: "Giờ Mùi (13h-15h)" },
  { value: "15", label: "Giờ Thân (15h-17h)" },
  { value: "17", label: "Giờ Dậu (17h-19h)" },
  { value: "19", label: "Giờ Tuất (19h-21h)" },
  { value: "21", label: "Giờ Hợi (21h-23h)" },
];

export default function BirthForm({
  value,
  onChange,
  onSubmit,
  canPrint,
  fieldErrors,
  isSubmitting,
  hasDirtyChanges,
}: Props) {
  const update = (patch: Partial<BirthInput>) => onChange({ ...value, ...patch });
  const fieldOrder: Array<keyof BirthInput> = ["fullName", "day", "month", "year", "birthHour", "birthMinute", "horoscopeYear"];

  React.useEffect(() => {
    const firstField = fieldOrder.find((field) => fieldErrors[field]);
    if (firstField) document.getElementById(firstField)?.focus();
  }, [fieldErrors]);

  const getErrorId = (field: keyof BirthInput) => `${field}-error`;

  return (
    <div className="form-shell form-shell--compact">
      <form className="birth-form birth-form--compact" onSubmit={(e) => e.preventDefault()}>
        <section className="form-card-unified">
          {/* Row 1: Name + Gender + Calendar */}
          <div className="form-row form-row--3col">
            <div className="form-field form-field--grow">
              <label htmlFor="fullName">Họ tên</label>
              <input
                id="fullName"
                type="text"
                placeholder="Vui lòng nhập tên hiển thị"
                value={value.fullName}
                onChange={(e) => update({ fullName: e.target.value })}
                aria-invalid={fieldErrors.fullName ? "true" : "false"}
                aria-describedby={fieldErrors.fullName ? getErrorId("fullName") : undefined}
              />
              {fieldErrors.fullName && <p id={getErrorId("fullName")} className="form-field__error">{fieldErrors.fullName}</p>}
            </div>
            <div className="form-field form-field--sm">
              <label htmlFor="gender">Giới tính</label>
              <select id="gender" value={value.gender} onChange={(e) => update({ gender: e.target.value as Gender })}>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>
            <div className="form-field form-field--sm">
              <label htmlFor="calendarType">Loại lịch</label>
              <select id="calendarType" value={value.calendarType} onChange={(e) => update({ calendarType: e.target.value as BirthInput["calendarType"] })}>
                <option value="solar">Dương</option>
                <option value="lunar">Âm</option>
              </select>
            </div>
          </div>

          {/* Row 2: Date of birth */}
          <div className="form-row form-row--4col">
            <div className="form-field">
              <label htmlFor="day">Ngày *</label>
              <input
                id="day"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="DD"
                value={value.day}
                onChange={(e) => update({ day: clampNumberInput(e.target.value, 2, 31) })}
                aria-invalid={fieldErrors.day ? "true" : "false"}
              />
              {fieldErrors.day && <p id={getErrorId("day")} className="form-field__error">{fieldErrors.day}</p>}
            </div>
            <div className="form-field">
              <label htmlFor="month">Tháng *</label>
              <input
                id="month"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="MM"
                value={value.month}
                onChange={(e) => update({ month: clampNumberInput(e.target.value, 2, 12) })}
                aria-invalid={fieldErrors.month ? "true" : "false"}
              />
              {fieldErrors.month && <p id={getErrorId("month")} className="form-field__error">{fieldErrors.month}</p>}
            </div>
            <div className="form-field">
              <label htmlFor="year">Năm *</label>
              <input
                id="year"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="YYYY"
                value={value.year}
                onChange={(e) => update({ year: onlyDigits(e.target.value).slice(0, 4) })}
                aria-invalid={fieldErrors.year ? "true" : "false"}
              />
              {fieldErrors.year && <p id={getErrorId("year")} className="form-field__error">{fieldErrors.year}</p>}
            </div>
            <div className="form-field form-field--hour">
              <label htmlFor="birthHour">Giờ sinh {value.unknownBirthTime ? "" : "*"}</label>
              <select
                id="birthHour"
                value={value.birthHour}
                onChange={(e) => update({ birthHour: e.target.value, birthMinute: "0" })}
                disabled={value.unknownBirthTime}
                aria-invalid={fieldErrors.birthHour ? "true" : "false"}
              >
                <option value="">-- Chọn giờ --</option>
                {BIRTH_HOURS.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
              {fieldErrors.birthHour && <p id={getErrorId("birthHour")} className="form-field__error">{fieldErrors.birthHour}</p>}
            </div>
          </div>

          {/* Row 3: Unknown time checkbox + Hide info + Horoscope year */}
          <div className="form-row form-row--between">
            <div className="form-row-options">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={value.unknownBirthTime}
                  onChange={(e) => update({
                    unknownBirthTime: e.target.checked,
                    birthHour: e.target.checked ? "" : value.birthHour,
                    birthMinute: e.target.checked ? "" : value.birthMinute,
                  })}
                />
                <span>Không rõ giờ sinh</span>
              </label>
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={value.hidePersonalInfo}
                  onChange={(e) => update({ hidePersonalInfo: e.target.checked })}
                />
                <span>Ẩn thông tin</span>
              </label>
            </div>
            <div className="form-field form-field--inline">
              <label htmlFor="horoscopeYear">Năm xem vận:</label>
              <input
                id="horoscopeYear"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="2025"
                value={value.horoscopeYear}
                onChange={(e) => update({ horoscopeYear: onlyDigits(e.target.value).slice(0, 4) })}
                aria-invalid={fieldErrors.horoscopeYear ? "true" : "false"}
              />
              {fieldErrors.horoscopeYear && <p id={getErrorId("horoscopeYear")} className="form-field__error">{fieldErrors.horoscopeYear}</p>}
            </div>
          </div>

          {value.unknownBirthTime && (
            <p className="form-hint form-hint--warning">
              Lá số sẽ mang tính tham khảo do thiếu giờ sinh chính xác.
            </p>
          )}

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="btn-primary" onClick={onSubmit} aria-busy={isSubmitting}>
              {isSubmitting ? "Đang lập..." : canPrint ? "Lập lại" : "Lập lá số"}
            </button>
            <button type="button" className="btn-ghost" onClick={() => window.print()} disabled={!canPrint}>
              In
            </button>
          </div>

          {hasDirtyChanges && (
            <p className="form-hint form-hint--warning">Bấm "Lập lại" để cập nhật kết quả.</p>
          )}
          {fieldErrors.form && <p className="form-error-msg" role="alert">{fieldErrors.form}</p>}
        </section>
      </form>
    </div>
  );
}

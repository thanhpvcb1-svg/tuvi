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

  if (!digits) {
    return "";
  }

  const parsed = Number(digits);
  if (Number.isNaN(parsed)) {
    return "";
  }

  return String(Math.min(parsed, max));
};

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
    if (!firstField) {
      return;
    }

    document.getElementById(firstField)?.focus();
  }, [fieldErrors]);

  const getErrorId = (field: keyof BirthInput) => `${field}-error`;

  return (
    <div className="form-shell">
      <form className="birth-form" onSubmit={(event) => event.preventDefault()}>
        <section className="form-section-card field-full">
          <div className="form-section-head">
            <div className="form-group-heading">
              <p className="eyebrow">Nhóm 1</p>
              <h2>Thông tin sinh</h2>
            </div>
          </div>

          <div className="form-section-grid">
            <div className="field field-half">
              <label htmlFor="fullName">Họ tên *</label>
              <input
                id="fullName"
                type="text"
                value={value.fullName}
                onChange={(event) => update({ fullName: event.target.value })}
                aria-invalid={fieldErrors.fullName ? "true" : "false"}
                aria-describedby={fieldErrors.fullName ? getErrorId("fullName") : undefined}
              />
              <p className="field-help">Có thể dùng tên ngắn hoặc biệt danh nếu bạn không muốn nhập tên thật.</p>
              {fieldErrors.fullName ? <p id={getErrorId("fullName")} className="field-error">{fieldErrors.fullName}</p> : null}
            </div>

            <div className="field field-quarter">
              <label htmlFor="gender">Giới tính *</label>
              <select id="gender" value={value.gender} onChange={(event) => update({ gender: event.target.value as Gender })}>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>

            <div className="field field-quarter">
              <label htmlFor="calendarType">Loại lịch *</label>
              <select
                id="calendarType"
                value={value.calendarType}
                onChange={(event) => update({ calendarType: event.target.value as BirthInput["calendarType"] })}
              >
                <option value="solar">Dương lịch</option>
                <option value="lunar">Âm lịch</option>
              </select>
              <p className="field-help">Nếu giấy tờ ghi ngày dương lịch, giữ mặc định Dương lịch.</p>
            </div>

            <div className="field field-third">
              <label htmlFor="day">Ngày sinh *</label>
              <input
                id="day"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Ngày"
                value={value.day}
                onChange={(event) => update({ day: clampNumberInput(event.target.value, 2, 31) })}
                aria-invalid={fieldErrors.day ? "true" : "false"}
                aria-describedby={fieldErrors.day ? getErrorId("day") : undefined}
              />
              {fieldErrors.day ? <p id={getErrorId("day")} className="field-error">{fieldErrors.day}</p> : null}
            </div>

            <div className="field field-third">
              <label htmlFor="month">Tháng sinh *</label>
              <input
                id="month"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Tháng"
                value={value.month}
                onChange={(event) => update({ month: clampNumberInput(event.target.value, 2, 12) })}
                aria-invalid={fieldErrors.month ? "true" : "false"}
                aria-describedby={fieldErrors.month ? getErrorId("month") : undefined}
              />
              {fieldErrors.month ? <p id={getErrorId("month")} className="field-error">{fieldErrors.month}</p> : null}
            </div>

            <div className="field field-third">
              <label htmlFor="year">Năm sinh *</label>
              <input
                id="year"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Năm"
                value={value.year}
                onChange={(event) => update({ year: onlyDigits(event.target.value).slice(0, 4) })}
                aria-invalid={fieldErrors.year ? "true" : "false"}
                aria-describedby={fieldErrors.year ? getErrorId("year") : undefined}
              />
              {fieldErrors.year ? <p id={getErrorId("year")} className="field-error">{fieldErrors.year}</p> : null}
            </div>

            <div className="field field-quarter">
              <label htmlFor="birthHour">Giờ sinh {value.unknownBirthTime ? "" : "*"}</label>
              <input
                id="birthHour"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Giờ"
                value={value.birthHour}
                onChange={(event) => update({ birthHour: clampNumberInput(event.target.value, 2, 23) })}
                disabled={value.unknownBirthTime}
                aria-invalid={fieldErrors.birthHour ? "true" : "false"}
                aria-describedby={fieldErrors.birthHour ? getErrorId("birthHour") : undefined}
              />
              <p className="field-help">Giờ sinh ảnh hưởng đến cách an Mệnh, Thân và nhiều lớp sao trong lá số.</p>
              {fieldErrors.birthHour ? <p id={getErrorId("birthHour")} className="field-error">{fieldErrors.birthHour}</p> : null}
            </div>

            <div className="field field-quarter">
              <label htmlFor="birthMinute">Phút sinh</label>
              <input
                id="birthMinute"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Phút"
                value={value.birthMinute}
                onChange={(event) => update({ birthMinute: clampNumberInput(event.target.value, 2, 59) })}
                disabled={value.unknownBirthTime}
                aria-invalid={fieldErrors.birthMinute ? "true" : "false"}
                aria-describedby={fieldErrors.birthMinute ? getErrorId("birthMinute") : undefined}
              />
              <p className="field-help">Không nhớ phút sinh có thể để trống, hệ thống sẽ hiểu là 00 phút.</p>
              {fieldErrors.birthMinute ? <p id={getErrorId("birthMinute")} className="field-error">{fieldErrors.birthMinute}</p> : null}
            </div>

            <div className="field field-toggle-compact">
              <label className="checkbox-field checkbox-card">
                <input
                  type="checkbox"
                  checked={value.unknownBirthTime}
                  onChange={(event) =>
                    update({
                      unknownBirthTime: event.target.checked,
                      birthHour: event.target.checked ? "" : value.birthHour,
                      birthMinute: event.target.checked ? "" : value.birthMinute,
                    })
                  }
                />
                <span>
                  <strong>Không rõ giờ sinh</strong>
                </span>
              </label>
              {value.unknownBirthTime ? (
                <p className="field-warning">
                  Bạn vẫn có thể xem bản tham khảo, nhưng mức độ chi tiết và độ sát sẽ thấp hơn so với khi có giờ sinh cụ thể.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="form-section-card form-section-card--soft field-full">
          <div className="form-section-head">
            <div className="form-group-heading">
              <p className="eyebrow">Nhóm 2</p>
              <h2>Tùy chọn xem hạn</h2>
            </div>
            <p className="form-section-note">Chọn năm bạn muốn xem để theo dõi đại vận và tiểu vận tương ứng trên lá số.</p>
          </div>

          <div className="form-section-grid">
            <div className="field field-third">
              <label htmlFor="horoscopeYear">Năm xem vận hạn *</label>
              <input
                id="horoscopeYear"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Ví dụ: 2026"
                value={value.horoscopeYear}
                onChange={(event) => update({ horoscopeYear: onlyDigits(event.target.value).slice(0, 4) })}
                aria-invalid={fieldErrors.horoscopeYear ? "true" : "false"}
                aria-describedby={fieldErrors.horoscopeYear ? getErrorId("horoscopeYear") : undefined}
              />
              <p className="field-help">Nên chọn năm bạn đang cần xem công việc, tài chính, tình cảm hoặc vận hạn.</p>
              {fieldErrors.horoscopeYear ? <p id={getErrorId("horoscopeYear")} className="field-error">{fieldErrors.horoscopeYear}</p> : null}
            </div>
          </div>
        </section>

        <div className="form-actions-card field-full">
          <div className="actions">
            <button type="button" className="primary-button" onClick={onSubmit} aria-busy={isSubmitting}>
              {isSubmitting ? "Đang lập lá số..." : canPrint ? "Lập lại lá số" : "Lập lá số miễn phí"}
            </button>
            <button type="button" className="ghost-button" onClick={() => window.print()} disabled={!canPrint}>
              In lá số
            </button>
          </div>

          {hasDirtyChanges ? (
            <p className="form-warning">
              Bạn đã thay đổi thông tin. Hãy bấm “Lập lại lá số” để cập nhật kết quả mới.
            </p>
          ) : null}
          {fieldErrors.form ? <p className="form-error" role="alert">{fieldErrors.form}</p> : null}
        </div>
      </form>
    </div>
  );
}

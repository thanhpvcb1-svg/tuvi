import React, { useState } from "react";
import Analytics from "../lib/analytics";

type LeadData = {
  name: string;
  phone: string;
  email: string;
  interest: string;
  message: string;
};

type Props = {
  onSubmit?: (data: LeadData) => void;
  eyebrow?: string;
  title?: string;
  description?: string;
  compact?: boolean;
  formLocation?: string;
};

const STORAGE_KEY = "lead_capture_submitted";
const WEBHOOK_URL = import.meta.env.VITE_LEAD_WEBHOOK_URL || "";

const interestOptions = [
  { value: "", label: "Chọn chủ đề quan tâm" },
  { value: "cong-viec", label: "Công việc / Sự nghiệp" },
  { value: "tai-chinh", label: "Tài chính / Đầu tư" },
  { value: "tinh-cam", label: "Tình cảm / Hôn nhân" },
  { value: "van-han", label: "Vận hạn năm nay" },
  { value: "tong-quat", label: "Xem tổng quát lá số" },
  { value: "khac", label: "Khác" },
];

export default function LeadCaptureForm({
  onSubmit,
  eyebrow = "Nhận tư vấn",
  title = "Đăng ký nhận hỗ trợ từ chuyên gia",
  description = "Để lại thông tin, chúng tôi sẽ liên hệ tư vấn gói phù hợp với nhu cầu của bạn.",
  compact = false,
  formLocation = "unknown",
}: Props) {
  const [formData, setFormData] = useState<LeadData>({
    name: "",
    phone: "",
    email: "",
    interest: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [error, setError] = useState("");

  const handleChange = (field: keyof LeadData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length >= 9 && cleaned.length <= 11;
  };

  const validateEmail = (email: string) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Vui lòng nhập họ tên.");
      return;
    }

    if (!formData.phone.trim() || !validatePhone(formData.phone)) {
      setError("Vui lòng nhập số điện thoại hợp lệ.");
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("Email không hợp lệ.");
      return;
    }

    setIsSubmitting(true);

    try {
      const leadPayload = {
        ...formData,
        timestamp: new Date().toISOString(),
        source: window.location.pathname,
        formLocation,
        userAgent: navigator.userAgent,
      };

      // Lưu vào localStorage như backup
      const leads = JSON.parse(localStorage.getItem("captured_leads") || "[]");
      leads.push(leadPayload);
      localStorage.setItem("captured_leads", JSON.stringify(leads));

      // Gửi đến webhook nếu có cấu hình
      if (WEBHOOK_URL) {
        try {
          await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(leadPayload),
          });
        } catch (webhookError) {
          console.warn("Webhook failed, lead saved locally:", webhookError);
        }
      }

      // Track analytics
      Analytics.leadFormSubmitted(formLocation, formData.interest);

      // Gọi callback nếu có
      onSubmit?.(formData);

      // Đánh dấu đã submit
      setSubmitted(true);
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {}
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`lead-capture-card${compact ? " lead-capture-card--compact" : ""}`}>
        <div className="lead-capture-success">
          <div className="lead-capture-success-icon">✓</div>
          <h3>Cảm ơn bạn đã đăng ký!</h3>
          <p>Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`lead-capture-card${compact ? " lead-capture-card--compact" : ""}`}>
      {!compact && (
        <div className="lead-capture-header">
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      )}

      <form className="lead-capture-form" onSubmit={handleSubmit}>
        <div className="lead-capture-row">
          <div className="lead-capture-field">
            <label htmlFor="lead-name">Họ tên *</label>
            <input
              id="lead-name"
              type="text"
              placeholder="Nhập họ tên"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div className="lead-capture-field">
            <label htmlFor="lead-phone">Số điện thoại *</label>
            <input
              id="lead-phone"
              type="tel"
              placeholder="0901234567"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>
        </div>

        <div className="lead-capture-row">
          <div className="lead-capture-field">
            <label htmlFor="lead-email">Email</label>
            <input
              id="lead-email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>
          <div className="lead-capture-field">
            <label htmlFor="lead-interest">Chủ đề quan tâm</label>
            <select
              id="lead-interest"
              value={formData.interest}
              onChange={(e) => handleChange("interest", e.target.value)}
            >
              {interestOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!compact && (
          <div className="lead-capture-field lead-capture-field--full">
            <label htmlFor="lead-message">Ghi chú thêm</label>
            <textarea
              id="lead-message"
              placeholder="Mô tả ngắn về vấn đề bạn muốn được tư vấn..."
              rows={3}
              value={formData.message}
              onChange={(e) => handleChange("message", e.target.value)}
            />
          </div>
        )}

        {error && <p className="lead-capture-error">{error}</p>}

        <button
          type="submit"
          className="primary-button lead-capture-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang gửi..." : "Đăng ký nhận tư vấn"}
        </button>

        <p className="lead-capture-note">
          Thông tin của bạn được bảo mật và chỉ dùng để liên hệ tư vấn.
        </p>
      </form>
    </div>
  );
}

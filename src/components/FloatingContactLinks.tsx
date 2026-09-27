import React from "react";
import { contactFacebookUrl, contactSmsNumber, contactZaloUrl } from "../utils/appUtils";

const smsNumber = contactSmsNumber;
const zaloUrl = contactZaloUrl;
const facebookUrl = contactFacebookUrl;

const smsMessage = encodeURIComponent("Chào bạn, mình cần hỗ trợ về lá số tử vi.");
const smsHref = smsNumber ? `sms:${smsNumber}?body=${smsMessage}` : `sms:?body=${smsMessage}`;

const contactLinks = [
  {
    id: "sms",
    label: "SMS",
    href: smsHref,
    className: "floating-contact-link floating-contact-link--sms",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="floating-contact-icon">
        <path
          d="M4 6.5C4 5.67 4.67 5 5.5 5h13c.83 0 1.5.67 1.5 1.5v8c0 .83-.67 1.5-1.5 1.5H10l-4.25 3.3c-.49.38-1.2.03-1.2-.59V16.8A1.5 1.5 0 0 1 4 15.4V6.5Z"
          fill="currentColor"
        />
        <path d="m7 8.75 5 3.5 5-3.5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "zalo",
    label: "Zalo",
    href: zaloUrl,
    className: "floating-contact-link floating-contact-link--zalo",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="floating-contact-icon">
        <path
          d="M12 3.25c-4.97 0-9 3.53-9 7.88 0 2.47 1.31 4.68 3.36 6.12l-.72 3.34c-.09.43.37.75.75.52l3.38-2.05c.71.17 1.46.25 2.23.25 4.97 0 9-3.53 9-7.88s-4.03-7.88-9-7.88Z"
          fill="currentColor"
        />
        <path d="M7.6 9.2h8.8l-6.1 5.7h6" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "FB",
    href: facebookUrl,
    className: "floating-contact-link floating-contact-link--facebook",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="floating-contact-icon">
        <path
          d="M13.35 21v-7.6h2.56l.39-2.97h-2.95V8.54c0-.86.24-1.45 1.48-1.45H16.4V4.43c-.27-.04-1.19-.11-2.26-.11-2.23 0-3.76 1.36-3.76 3.87v2.24H7.85v2.97h2.53V21h2.97Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
] as const;

// Chỉ hiện kênh đã cấu hình thật; không có kênh nào thì ẩn cả khối.
const configuredLinks = contactLinks.filter((link) =>
  link.id === "sms" ? Boolean(smsNumber) : link.id === "zalo" ? Boolean(zaloUrl) : Boolean(facebookUrl),
);

export default function FloatingContactLinks() {
  if (configuredLinks.length === 0) return null;
  return (
    <aside className="floating-contact-links" aria-label="Liên hệ nhanh">
      {configuredLinks.map((link) => (
        <a
          key={link.id}
          className={link.className}
          href={link.href}
          target={link.id === "sms" ? undefined : "_blank"}
          rel={link.id === "sms" ? undefined : "noreferrer"}
          aria-label={link.label}
        >
          {link.icon}
          <span className="sr-only">{link.label}</span>
        </a>
      ))}
    </aside>
  );
}

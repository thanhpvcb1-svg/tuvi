import React, { useState } from "react";

export type FAQItem = {
  question: string;
  answer: string;
};

type Props = {
  eyebrow?: string;
  title?: string;
  description?: string;
  faqs: FAQItem[];
  id?: string;
};

export default function FAQSection({
  eyebrow = "FAQ",
  title = "Câu hỏi thường gặp",
  description = "Những câu hỏi phổ biến trước khi lập lá số hoặc chọn gói luận giải.",
  faqs,
  id = "faq",
}: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="content-section" id={id}>
      <div className="section-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="faq-list">
        {faqs.map((item, index) => {
          const isOpen = openIndex === index;
          const panelId = `${id}-panel-${index}`;
          const buttonId = `${id}-button-${index}`;

          return (
            <article key={item.question} className={`faq-item${isOpen ? " is-open" : ""}`}>
              <button
                id={buttonId}
                type="button"
                className="faq-trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex((current) => (current === index ? null : index))}
              >
                <span>{item.question}</span>
                <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>
              <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen} className="faq-panel">
                <p>{item.answer}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

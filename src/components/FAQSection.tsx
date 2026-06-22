import React, { useState } from "react";

const faqs = [
  ["Lập lá số tử vi có miễn phí không?", "Có. Bạn có thể tạo lá số cơ bản miễn phí ngay trên trình duyệt mà không cần đăng ký tài khoản."],
  ["Tôi không nhớ giờ sinh thì có xem được không?", "Có. Bạn có thể chọn chế độ 'Không rõ giờ sinh' để xem bản tham khảo, nhưng độ chính xác sẽ thấp hơn so với khi có giờ sinh cụ thể."],
  ["Thông tin của tôi có được lưu không?", "Thông tin không được lưu trên máy chủ. Toàn bộ xử lý diễn ra ngay trên trình duyệt của bạn và dữ liệu chỉ dùng để lập lá số."],
  ["Tôi nhận kết quả trong bao lâu?", "Với lá số cơ bản, kết quả hiển thị ngay lập tức sau khi nhập thông tin. Với dịch vụ luận giải từ chuyên gia, thông thường bạn nhận phản hồi trong vòng 24–48 giờ."],
  ["Ai là người thực hiện luận giải?", "Các bản luận giải chuyên sâu do chuyên gia tử vi có nhiều năm kinh nghiệm trực tiếp thực hiện, không phải tự động hóa."],
  ["Có được hỏi thêm sau khi nhận kết quả không?", "Tùy theo gói dịch vụ. Gói 'Luận Giải 1 Câu Hỏi' bao gồm phần trả lời cho câu hỏi bạn gửi. Nếu cần giải đáp sâu hơn, bạn có thể chọn gói 'Tư Vấn Trực Tiếp 1:1'."],
  ["Tôi có thể đặt lịch trực tiếp với thầy không?", "Có. Gói 'Tư Vấn Trực Tiếp 1:1' cho phép bạn đặt lịch và trao đổi trực tiếp trong 60 phút về toàn bộ lá số và các vấn đề bạn quan tâm."],
  ["Âm lịch và dương lịch khác nhau thế nào khi nhập ngày sinh?", "Bạn cần chọn đúng loại lịch tương ứng với thông tin mình có. Nếu không chắc, hãy nhập theo dương lịch và ghi chú khi gửi câu hỏi cho chuyên gia."],
  ["Lá số tử vi có chính xác tuyệt đối không?", "Không. Đây là nội dung tham khảo, chiêm nghiệm và giải trí, không phải kết luận tuyệt đối về tương lai."],
  ["Kết quả có thay thế tư vấn chuyên môn không?", "Không. Kết quả không thay thế tư vấn y tế, tài chính, pháp lý hoặc các quyết định quan trọng trong cuộc sống."],
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="content-section" id="faq">
      <div className="section-heading">
        <p className="eyebrow">Câu Hỏi Thường Gặp</p>
        <h2>Giải Đáp Thắc Mắc</h2>
        <p>Những câu hỏi phổ biến từ người dùng trước khi tạo lá số hoặc chọn dịch vụ luận giải.</p>
      </div>

      <div className="faq-list">
        {faqs.map(([question, answer], index) => {
          const isOpen = openIndex === index;
          const panelId = `faq-panel-${index}`;
          const buttonId = `faq-button-${index}`;

          return (
            <article key={question} className={`faq-item${isOpen ? " is-open" : ""}`}>
              <button
                id={buttonId}
                type="button"
                className="faq-trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex((current) => (current === index ? null : index))}
              >
                <span>{question}</span>
                <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>
              <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen} className="faq-panel">
                <p>{answer}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

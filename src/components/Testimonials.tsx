import React from "react";

export type Testimonial = {
  id: string;
  name: string;
  role?: string;
  content: string;
  rating: number;
  date?: string;
};

const defaultTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Minh Anh",
    role: "Nhân viên văn phòng",
    content: "Lần đầu xem tử vi online mà thấy rõ ràng và dễ hiểu. Phần luận giải AI giúp mình hiểu được tổng quan lá số mà không cần biết nhiều về tử vi.",
    rating: 5,
    date: "2 tuần trước",
  },
  {
    id: "2",
    name: "Hoàng Nam",
    role: "Chủ doanh nghiệp",
    content: "Gói hỏi 1 câu rất hữu ích khi mình đang phân vân chuyện mở rộng kinh doanh. Câu trả lời đi thẳng vào vấn đề, không lan man.",
    rating: 5,
    date: "1 tháng trước",
  },
  {
    id: "3",
    name: "Thu Hà",
    role: "Giáo viên",
    content: "Mình thích cách trình bày lá số trực quan, dễ nhìn. Phần đại vận và tiểu vận hiển thị rõ ràng, tiện theo dõi theo từng năm.",
    rating: 5,
    date: "3 tuần trước",
  },
  {
    id: "4",
    name: "Đức Trung",
    role: "Kỹ sư IT",
    content: "Trang web load nhanh, giao diện đẹp. Quan trọng là dữ liệu không lưu trên server nên yên tâm về bảo mật thông tin cá nhân.",
    rating: 4,
    date: "1 tuần trước",
  },
];

type Props = {
  testimonials?: Testimonial[];
  eyebrow?: string;
  title?: string;
  description?: string;
};

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? "#d4a017" : "none"}
    stroke="#d4a017"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export default function Testimonials({
  testimonials = defaultTestimonials,
  eyebrow = "Đánh giá",
  title = "Người dùng nói gì về LaSoTuVi",
  description = "Những phản hồi thực tế từ người đã sử dụng dịch vụ lập lá số và luận giải.",
}: Props) {
  return (
    <section className="content-section" id="testimonials">
      <div className="section-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="testimonial-grid">
        {testimonials.map((item) => (
          <article key={item.id} className="testimonial-card">
            <div className="testimonial-rating">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} filled={i < item.rating} />
              ))}
            </div>
            <blockquote className="testimonial-content">
              "{item.content}"
            </blockquote>
            <footer className="testimonial-author">
              <strong>{item.name}</strong>
              {item.role && <span>{item.role}</span>}
              {item.date && <time>{item.date}</time>}
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

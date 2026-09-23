import { useEffect, useRef, useState } from "react";

const TIPS = [
  "\"Lần đầu xem tử vi online mà thấy rõ ràng và dễ hiểu. Phần luận giải AI giúp mình hiểu được tổng quan lá số.\" - Minh Anh",
  "\"Gói hỏi 1 câu rất hữu ích khi mình đang phân vân chuyện mở rộng kinh doanh. Câu trả lời đi thẳng vào vấn đề.\" - Hoàng Nam",
  "\"Mình thích cách trình bày lá số trực quan, dễ nhìn. Phần đại vận và tiểu vận hiển thị rõ ràng.\" - Thu Hà",
  "\"Trang web load nhanh, giao diện đẹp. Dữ liệu không lưu trên server nên yên tâm về bảo mật.\" - Đức Trung",
];

const SESSION_KEY = "helper_tip_dismissed";
const INITIAL_DELAY = 4_000;
const DISPLAY_DURATION = 6_000;
const MIN_WIDTH = 1024;

const isDesktopWidth = () => window.innerWidth >= MIN_WIDTH;
const sessionDismissed = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
};

export default function SocialProofPopup() {
  const [visible, setVisible] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (sessionDismissed() || !isDesktopWidth()) {
      return;
    }

    const clear = () => {
      timerIds.current.forEach(clearTimeout);
      timerIds.current = [];
    };

    timerIds.current.push(
      setTimeout(() => {
        setTipIndex(Math.floor(Math.random() * TIPS.length));
        setVisible(true);
      }, INITIAL_DELAY),
    );

    timerIds.current.push(
      setTimeout(() => {
        setVisible(false);
      }, INITIAL_DELAY + DISPLAY_DURATION),
    );

    const onResize = () => {
      if (!isDesktopWidth()) {
        clear();
        setVisible(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => {
      clear();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const dismiss = () => {
    timerIds.current.forEach(clearTimeout);
    timerIds.current = [];
    setVisible(false);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
  };

  const handleCta = () => {
    document.getElementById("premium")?.scrollIntoView({ behavior: "smooth", block: "start" });
    dismiss();
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="social-proof-popup" role="status" aria-live="polite">
      <div className="social-proof-popup-icon" aria-hidden="true">
        ★
      </div>
      <div className="social-proof-popup-body">
        <p className="social-proof-popup-email">Đánh giá từ người dùng</p>
        <p className="social-proof-popup-text">{TIPS[tipIndex]}</p>
        <button type="button" className="social-proof-popup-cta" onClick={handleCta}>
          Xem gói hỗ trợ
        </button>
      </div>
      <button type="button" className="social-proof-popup-close" onClick={dismiss} aria-label="Đóng thông báo">
        x
      </button>
    </div>
  );
}

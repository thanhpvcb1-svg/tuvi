import { useEffect, useRef, useState } from "react";

const TIPS = [
  "Bạn có thể lập lá số miễn phí trước rồi mới quyết định có cần hỏi sâu hơn hay không.",
  "Nếu chưa chắc giờ sinh, hãy dùng bản tham khảo để định hướng câu hỏi thay vì kết luận quá sớm.",
  "Khi liên hệ, một câu hỏi rõ thường hữu ích hơn một yêu cầu quá rộng.",
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
        Tip
      </div>
      <div className="social-proof-popup-body">
        <p className="social-proof-popup-email">Gợi ý khi dùng trang</p>
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

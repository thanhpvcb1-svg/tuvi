import { useEffect, useRef, useState } from "react";

const POPUPS = [
  { email: "phungc****uy@gmail.com", plan: "Luận Giải Chuyên Sâu", price: "199k" },
  { email: "nguyenm****anh@gmail.com", plan: "Luận Giải 1 Câu Hỏi", price: "99k" },
  { email: "tranthi****h@gmail.com", plan: "Luận Giải Toàn Diện", price: "499k" },
  { email: "hoangv****et@gmail.com", plan: "Tư Vấn Trực Tiếp", price: "999k" },
  { email: "lethib****a@gmail.com", plan: "Luận Giải 1 Câu Hỏi", price: "99k" },
  { email: "dinhq****g@gmail.com", plan: "Luận Giải Chuyên Sâu", price: "199k" },
];

const SESSION_KEY = "sp_dismissed";
const INITIAL_DELAY = 2_000;
const DISPLAY_DURATION = 2_000;
const CYCLE_INTERVAL = 30_000;
const MIN_WIDTH = 1024;

const isDesktopWidth = () => window.innerWidth >= MIN_WIDTH;
const sessionDismissed = () => {
  try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
};

export default function SocialProofPopup() {
  const [visible, setVisible] = useState(false);
  const [popupIndex, setPopupIndex] = useState(0);
  const indexRef = useRef(0);
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (sessionDismissed() || !isDesktopWidth()) return;

    const clear = () => {
      timerIds.current.forEach(clearTimeout);
      timerIds.current = [];
    };

    const schedule = (delay: number) => {
      const id = setTimeout(() => {
        if (sessionDismissed() || !isDesktopWidth()) return;
        setPopupIndex(indexRef.current);
        setVisible(true);

        timerIds.current.push(
          setTimeout(() => setVisible(false), DISPLAY_DURATION),
        );

        timerIds.current.push(
          setTimeout(() => {
            indexRef.current = (indexRef.current + 1) % POPUPS.length;
            schedule(0);
          }, CYCLE_INTERVAL),
        );
      }, delay);
      timerIds.current.push(id);
    };

    schedule(INITIAL_DELAY);

    const onResize = () => {
      if (!isDesktopWidth()) {
        clear();
        setVisible(false);
      } else if (timerIds.current.length === 0 && !sessionDismissed()) {
        schedule(INITIAL_DELAY);
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
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
  };

  const handleCta = () => {
    document.getElementById("premium")?.scrollIntoView({ behavior: "smooth", block: "start" });
    dismiss();
  };

  if (!visible) return null;

  const popup = POPUPS[popupIndex];

  return (
    <div className="social-proof-popup" role="status" aria-live="polite">
      <div className="social-proof-popup-icon" aria-hidden="true">💰</div>
      <div className="social-proof-popup-body">
        <p className="social-proof-popup-email">{popup.email}</p>
        <p className="social-proof-popup-text">
          Vừa thanh toán <strong>{popup.plan}</strong> {popup.price}
        </p>
        <button type="button" className="social-proof-popup-cta" onClick={handleCta}>
          Xem ngay
        </button>
      </div>
      <button
        type="button"
        className="social-proof-popup-close"
        onClick={dismiss}
        aria-label="Đóng thông báo"
      >
        ×
      </button>
    </div>
  );
}

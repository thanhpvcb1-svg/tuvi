import React, { useEffect, useState } from "react";

type Props = {
  onPrimaryClick: () => void;
  onSecondaryClick?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
  show?: boolean;
};

const MIN_SCROLL = 300;

export default function MobileStickyCTA({
  onPrimaryClick,
  onSecondaryClick,
  primaryLabel = "Lập lá số miễn phí",
  secondaryLabel = "Xem bảng giá",
  show = true,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) {
      setVisible(false);
      return;
    }

    const handleScroll = () => {
      setVisible(window.scrollY > MIN_SCROLL);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [show]);

  if (!visible) {
    return null;
  }

  return (
    <div className="mobile-sticky-cta">
      <button type="button" className="primary-button mobile-sticky-primary" onClick={onPrimaryClick}>
        {primaryLabel}
      </button>
      {onSecondaryClick && (
        <button type="button" className="ghost-button mobile-sticky-secondary" onClick={onSecondaryClick}>
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}

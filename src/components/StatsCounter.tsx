import { useEffect, useState } from "react";

type StatItem = {
  value: number;
  suffix?: string;
  label: string;
  icon: string;
};

const defaultStats: StatItem[] = [
  { value: 15000, suffix: "+", label: "Lá số đã lập", icon: "📊" },
  { value: 20000, suffix: "+", label: "Đoạn tri thức có điều kiện", icon: "📚" },
  { value: 98, suffix: "%", label: "Hài lòng", icon: "⭐" },
  { value: 24, suffix: "/7", label: "Hỗ trợ", icon: "💬" },
];

type Props = {
  stats?: StatItem[];
  className?: string;
};

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="stats-value">
      {displayValue.toLocaleString("vi-VN")}{suffix}
    </span>
  );
}

export default function StatsCounter({ stats = defaultStats, className = "" }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById("stats-counter");
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <section id="stats-counter" className={`stats-counter ${className}`}>
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stats-item">
            <span className="stats-icon">{stat.icon}</span>
            {isVisible ? (
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
            ) : (
              <span className="stats-value">0</span>
            )}
            <span className="stats-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

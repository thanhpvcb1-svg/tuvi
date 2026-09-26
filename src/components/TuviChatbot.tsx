import React, { useState, useRef, useEffect, useCallback } from "react";
import type { ChartView } from "../lib/types";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

type Props = {
  chart: ChartView;
  isVisible: boolean;
  userContext?: {
    gender?: string;
    yearToView?: number;
  };
};

// Câu hỏi gợi ý theo chủ đề - dựa trên xu hướng phổ biến
const SUGGESTED_QUESTIONS = {
  career: {
    icon: "💼",
    label: "Sự nghiệp",
    questions: [
      "Năm nay công việc có thuận lợi không?",
      "Có nên chuyển việc hoặc khởi nghiệp không?",
      "Nghề nghiệp nào phù hợp với tôi nhất?",
    ],
  },
  love: {
    icon: "💕",
    label: "Tình duyên",
    questions: [
      "Năm nay có cơ hội gặp người phù hợp không?",
      "Khi nào là thời điểm tốt để kết hôn?",
      "Hôn nhân của tôi có bền vững không?",
    ],
  },
  wealth: {
    icon: "💰",
    label: "Tài chính",
    questions: [
      "Năm nay tài vận của tôi thế nào?",
      "Có nên đầu tư trong năm nay không?",
      "Làm sao để cải thiện tài chính?",
    ],
  },
  health: {
    icon: "🏥",
    label: "Sức khỏe",
    questions: [
      "Tôi cần chú ý bệnh gì theo lá số?",
      "Năm nào cần cẩn thận về sức khỏe?",
    ],
  },
  family: {
    icon: "👨‍👩‍👧",
    label: "Gia đạo",
    questions: [
      "Quan hệ với cha mẹ thế nào?",
      "Con cái có hiếu thuận không?",
    ],
  },
};

const DAILY_FREE_LIMIT = 3;
const QUOTA_KEY = "tuvi-chat-quota";
const HISTORY_KEY = "tuvi-chat-history";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getQuota(): { date: string; count: number } {
  try {
    const stored = localStorage.getItem(QUOTA_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === getToday()) {
        return data;
      }
    }
  } catch {}
  return { date: getToday(), count: 0 };
}

function setQuota(count: number): void {
  localStorage.setItem(QUOTA_KEY, JSON.stringify({ date: getToday(), count }));
}

function TypingIndicator() {
  return (
    <div className="chat-typing">
      <span />
      <span />
      <span />
    </div>
  );
}

export default function TuviChatbot({ chart, isVisible, userContext }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quota, setQuotaState] = useState(getQuota);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const remainingQuota = DAILY_FREE_LIMIT - quota.count;
  const isQuotaExceeded = remainingQuota <= 0;

  // Scroll to bottom when new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset quota nếu sang ngày mới
  useEffect(() => {
    const stored = getQuota();
    setQuotaState(stored);
  }, []);

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || isLoading || isQuotaExceeded) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Gọi API chat
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          chart: {
            profile: chart.profile,
            palaces: chart.palaces?.map((p) => ({
              name: p.name,
              earthlyBranch: p.earthlyBranch,
              heavenlyStem: (p as any).heavenlyStem,
              majorStars: p.majorStars?.map((s) => s.name),
              isBodyPalace: p.isBodyPalace,
            })),
          },
          userContext,
          history: messages.slice(-4), // Gửi 4 tin nhắn gần nhất làm context
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.success ? data.answer : "Xin lỗi, tôi không thể trả lời câu hỏi này. Vui lòng thử lại.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update quota
      const newCount = quota.count + 1;
      setQuota(newCount);
      setQuotaState({ date: getToday(), count: newCount });
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [chart, userContext, messages, quota.count, isLoading, isQuotaExceeded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
    setActiveCategory(null);
  };

  if (!isVisible) return null;

  return (
    <div className="tuvi-chatbot">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <span className="chatbot-icon">🔮</span>
          <div>
            <h4>Hỏi đáp Tử Vi</h4>
            <p className="chatbot-subtitle">Hỏi bất kỳ điều gì về lá số của bạn</p>
          </div>
        </div>
        <div className="chatbot-quota">
          {isQuotaExceeded ? (
            <span className="quota-exceeded">Hết lượt miễn phí hôm nay</span>
          ) : (
            <span className="quota-remaining">Còn {remainingQuota} câu miễn phí</span>
          )}
        </div>
      </div>

      {/* Suggested Questions */}
      {messages.length === 0 && (
        <div className="chatbot-suggestions">
          <p className="suggestions-title">Chọn chủ đề bạn quan tâm:</p>
          <div className="suggestions-categories">
            {Object.entries(SUGGESTED_QUESTIONS).map(([key, category]) => (
              <button
                key={key}
                type="button"
                className={`category-chip ${activeCategory === key ? "is-active" : ""}`}
                onClick={() => setActiveCategory(activeCategory === key ? null : key)}
              >
                <span>{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>

          {activeCategory && (
            <div className="suggestions-questions">
              {SUGGESTED_QUESTIONS[activeCategory as keyof typeof SUGGESTED_QUESTIONS].questions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  className="suggestion-btn"
                  onClick={() => handleSuggestedQuestion(q)}
                  disabled={isQuotaExceeded}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="suggestions-popular">
            <p className="popular-title">Hoặc câu hỏi phổ biến:</p>
            <div className="popular-questions">
              <button
                type="button"
                className="popular-btn"
                onClick={() => handleSuggestedQuestion("Tổng quan vận mệnh năm nay của tôi thế nào?")}
                disabled={isQuotaExceeded}
              >
                🌟 Vận mệnh năm nay
              </button>
              <button
                type="button"
                className="popular-btn"
                onClick={() => handleSuggestedQuestion("Điểm mạnh và điểm yếu trong lá số của tôi là gì?")}
                disabled={isQuotaExceeded}
              >
                💪 Điểm mạnh & yếu
              </button>
              <button
                type="button"
                className="popular-btn"
                onClick={() => handleSuggestedQuestion("Tôi nên chú ý điều gì trong năm nay?")}
                disabled={isQuotaExceeded}
              >
                ⚠️ Lưu ý quan trọng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      {messages.length > 0 && (
        <div className="chatbot-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message chat-${msg.role}`}>
              <div className="message-avatar">
                {msg.role === "user" ? "👤" : "🔮"}
              </div>
              <div className="message-content">
                {msg.content.split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message chat-assistant">
              <div className="message-avatar">🔮</div>
              <div className="message-content">
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Quick suggestions after first message */}
      {messages.length > 0 && messages.length < 4 && !isLoading && !isQuotaExceeded && (
        <div className="chatbot-quick-suggestions">
          <button
            type="button"
            className="quick-suggestion"
            onClick={() => handleSuggestedQuestion("Cho tôi biết thêm chi tiết")}
          >
            Chi tiết hơn
          </button>
          <button
            type="button"
            className="quick-suggestion"
            onClick={() => handleSuggestedQuestion("Làm sao để cải thiện?")}
          >
            Cách cải thiện
          </button>
        </div>
      )}

      {/* Quota Exceeded CTA */}
      {isQuotaExceeded && (
        <div className="chatbot-upsell">
          <p>🔒 Bạn đã hết lượt hỏi miễn phí hôm nay</p>
          <a href="#pricing" className="upsell-btn">
            Mua thêm lượt hỏi - 50.000đ/câu
          </a>
          <span className="upsell-hint">Hoặc quay lại vào ngày mai</span>
        </div>
      )}

      {/* Input Form */}
      {!isQuotaExceeded && (
        <form className="chatbot-input" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi của bạn..."
            disabled={isLoading}
            maxLength={200}
          />
          <button type="submit" disabled={!input.trim() || isLoading}>
            {isLoading ? "..." : "Gửi"}
          </button>
        </form>
      )}
    </div>
  );
}

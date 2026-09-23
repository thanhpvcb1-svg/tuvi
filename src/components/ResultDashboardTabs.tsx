import React from "react";

type TabItem = {
  id: string;
  label: string;
};

type Props = {
  items: TabItem[];
  activeId: string;
  onSelect: (id: string) => void;
};

export default function ResultDashboardTabs({ items, activeId, onSelect }: Props) {
  return (
    <div className="dashboard-tabs" role="tablist" aria-label="Điều hướng kết quả">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === activeId}
          className={`dashboard-tab${item.id === activeId ? " is-active" : ""}`}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

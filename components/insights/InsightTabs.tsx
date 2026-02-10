"use client";

import { useRef, useEffect } from "react";

export interface TabConfig {
  id: string;
  label: string;
  icon: string;
  hasData: boolean;
}

interface InsightTabsProps {
  tabs: TabConfig[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function InsightTabs({ tabs, activeTab, onChange }: InsightTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const btn = activeRef.current;
      const scrollLeft = btn.offsetLeft - container.offsetWidth / 2 + btn.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeTab]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 hide-scrollbar"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isDisabled = !tab.hasData && tab.id !== "resumo";

        return (
          <button
            key={tab.id}
            ref={isActive ? activeRef : undefined}
            onClick={() => !isDisabled && onChange(tab.id)}
            disabled={isDisabled}
            className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
              isActive
                ? "bg-calma-primary text-white"
                : isDisabled
                  ? "bg-gray-200 text-gray-500/40"
                  : "bg-white border border-gray-100 text-gray-500"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

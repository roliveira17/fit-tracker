"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}

const THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pullingRef.current || isRefreshing) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    if (deltaY > 0) {
      // Resistance curve (sqrt dampening)
      const dampened = Math.min(Math.sqrt(deltaY) * 5, MAX_PULL);
      setPullDistance(dampened);
    } else {
      setPullDistance(0);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;

    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD / 2);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  const rotation = Math.min((pullDistance / THRESHOLD) * 360, 360);
  const opacity = Math.min(pullDistance / (THRESHOLD * 0.5), 1);

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col overflow-y-auto overscroll-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden shrink-0 transition-[height] duration-200"
        style={{ height: pullDistance > 0 || isRefreshing ? `${pullDistance}px` : "0px" }}
      >
        <span
          className={`material-symbols-outlined text-[24px] text-calma-primary ${isRefreshing ? "animate-spin" : ""}`}
          style={{
            opacity,
            transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
          }}
        >
          refresh
        </span>
      </div>

      {children}
    </div>
  );
}

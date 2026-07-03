import { ReactNode } from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Loader2, ArrowDown } from "lucide-react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  className?: string;
}

export default function PullToRefresh({ children, onRefresh, className = "" }: PullToRefreshProps) {
  const { containerRef, pullDistance, isRefreshing, progress, shouldRefresh } = usePullToRefresh({
    onRefresh,
    threshold: 80,
    maxPull: 120,
  });

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center transition-transform"
          style={{
            top: `${Math.max(pullDistance - 40, 0)}px`,
            opacity: progress,
          }}
        >
          <div className="w-9 h-9 rounded-full bg-card border border-border shadow-lg flex items-center justify-center">
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 text-[#0071E3] animate-spin" />
            ) : (
              <ArrowDown
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                  shouldRefresh ? "rotate-180 text-[#0071E3]" : ""
                }`}
                style={{ transform: `rotate(${progress * 180}deg)` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Content with pull transform */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : undefined,
          transition: pullDistance === 0 ? "transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

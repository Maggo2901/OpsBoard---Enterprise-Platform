import React from "react";

/**
 * OpsBoard Logo (uses png assets by default).
 * Place assets under /public/brand/ (or adjust paths).
 */
export function OpsBoardLogo({ variant = "header", className = "" }) {
  const iconSrc = "/brand/opsboard-icon-64.png";

  if (variant === "icon") {
    return <img src={iconSrc} alt="OpsBoard" className={className} />;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src={iconSrc} alt="OpsBoard" className="h-7 w-7" />
      <div className="leading-none">
        <div className="text-[14px] font-semibold text-textPrimary">OpsBoard</div>
        <div className="text-[10px] tracking-[0.22em] uppercase text-textTertiary">
          Enterprise Platform
        </div>
      </div>
    </div>
  );
}

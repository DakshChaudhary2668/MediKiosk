"use client";
import React from "react";

export type BadgeVariant = "default" | "p0" | "p1" | "p2" | "p3" | "ok" | "warn" | "info" | "neutral";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant = "default", children, className = "", style, ...props }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
    default: { background: "#F1F5F9", color: "#334155", border: "1px solid #E2E8F0" },
    p0:      { background: "#FDEBEC", color: "#9F2F2D", border: "1px solid rgba(159, 47, 45, 0.25)" },
    p1:      { background: "#FFF1E7", color: "#C2410C", border: "1px solid rgba(194, 65, 12, 0.25)" },
    p2:      { background: "#E1F3FE", color: "#1F6C9F", border: "1px solid rgba(31, 108, 159, 0.25)" },
    p3:      { background: "#EDF3EC", color: "#346538", border: "1px solid rgba(52, 101, 56, 0.25)" },
    ok:      { background: "#EDF3EC", color: "#346538", border: "1px solid rgba(52, 101, 56, 0.25)" },
    warn:    { background: "#FBF3DB", color: "#956400", border: "1px solid rgba(149, 100, 0, 0.25)" },
    info:    { background: "#E1F3FE", color: "#1F6C9F", border: "1px solid rgba(31, 108, 159, 0.25)" },
    neutral: { background: "#F8FAFC", color: "#475569", border: "1px solid #E2E8F0" },
  };

  return (
    <span
      className={`mk-badge ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        height: 22,
        padding: "0 8px",
        borderRadius: "var(--mk-radius-full)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}

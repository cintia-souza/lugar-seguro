import { type ReactNode } from "react";

interface BaseCardProps {
  children: ReactNode;
  className?: string;
  /** Padding size */
  padding?: "sm" | "md" | "lg";
}

const PADDING_MAP = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
} as const;

export default function BaseCard({ children, className = "", padding = "md" }: BaseCardProps) {
  return (
    <div
      className={`
        min-w-0
        overflow-hidden
        rounded-2xl
        border border-slate-100
        bg-white/90 backdrop-blur-sm
        shadow-sm
        ${PADDING_MAP[padding]}
        ${className}
      `.trim().replace(/\s+/g, " ")}
    >
      <div className="min-w-0 break-words">
        {children}
      </div>
    </div>
  );
}

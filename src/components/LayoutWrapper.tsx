import { type ReactNode } from "react";

interface LayoutWrapperProps {
  children: ReactNode;
  /** Use 'narrow' for forms/auth, 'default' for content, 'wide' for dashboards */
  size?: "narrow" | "default" | "wide";
  /** Center vertically (useful for auth pages) */
  centered?: boolean;
}

const SIZE_MAP = {
  narrow: "max-w-md",
  default: "max-w-2xl",
  wide: "max-w-5xl",
} as const;

export default function LayoutWrapper({ children, size = "default", centered = false }: LayoutWrapperProps) {
  return (
    <div className={`mx-auto w-full px-5 py-8 ${SIZE_MAP[size]} ${centered ? "flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center" : ""}`}>
      {children}
    </div>
  );
}

"use client";

import { type ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="flex flex-1 flex-col animate-page-enter">
      {children}
    </div>
  );
}

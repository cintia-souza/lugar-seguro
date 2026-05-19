"use client";

import { useEffect } from "react";

export default function ThemeLoader() {
  useEffect(() => {
    const saved = localStorage.getItem("meu-lugarzinho-theme");
    if (saved && saved !== "padrao") {
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ForceLight() {
  const { setTheme, resolvedTheme } = useTheme();
  useEffect(() => {
    if (resolvedTheme !== "light") setTheme("light");
  }, [resolvedTheme, setTheme]);
  return null;
}

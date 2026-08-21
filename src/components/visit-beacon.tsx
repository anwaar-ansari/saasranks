"use client";

import { useEffect } from "react";

export function VisitBeacon() {
  useEffect(() => {
    void fetch("/api/visit", { method: "POST" });
  }, []);
  return null;
}

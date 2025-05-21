"use client";

import React, { useEffect } from "react";
import { configure } from "react-hotkeys";

export default function Configuration({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    configure({
      ignoreRepeatedEventsWhenKeyHeldDown: false,
    });
  }, []);

  return <>{children}</>;
}
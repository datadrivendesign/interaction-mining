"use client";
import React from "react";
import { FrameData, Redaction } from "../../types";
import RedactScreenCanvas from "./redact-screen-canvas";

export function FocusView({
  screen,
  vh,
  copied,
  setCopied,
}: {
  screen: FrameData;
  vh: any;
  copied: Redaction[];
  setCopied: React.Dispatch<React.SetStateAction<Redaction[]>>;
}) {
  return (
    <>
      <div className="relative z-20 flex h-full w-full min-w-0 justify-center overflow-hidden">
        <RedactScreenCanvas
          screen={screen}
          vh={vh}
          copied={copied}
          setCopied={setCopied}
        />
      </div>
    </>
  );
}

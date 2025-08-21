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
  copied: Redaction | null;
  setCopied: React.Dispatch<React.SetStateAction<Redaction | null>>;
}) {
  return (
    <>
      <div className="flex justify-center w-full h-full overflow-hidden">
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

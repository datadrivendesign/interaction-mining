import { createContext } from "react";

import { Redaction, Screen, ScreenGesture } from "@prisma/client";

export const FormContext = createContext<{
  screens: Screen[];
  edits: {
    gestures: { [key: string]: ScreenGesture };
    redactions: { [key: string]: Redaction[] };
  };
  setScreens: React.Dispatch<React.SetStateAction<Screen[]>>;
  setEdits: React.Dispatch<
    React.SetStateAction<{
      gestures: { [key: string]: ScreenGesture };
      redactions: { [key: string]: Redaction[] };
    }>
  >;
}>({
  screens: [],
  edits: {
    gestures: {},
    redactions: {},
  },
  setScreens: () => {},
  setEdits: () => {},
});

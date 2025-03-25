import { Variants } from "motion/react"

export const loadingReducer = (
  state: any,
  action: {
    type: "SET_LOADED" | "SET_MESSAGE";
    payload?: any;
  }
) => {
  if (action.type === "SET_LOADED" && action.payload) {
    return {
      ...state,
      isLoaded: action.payload,
    };
  }

  if (action.type === "SET_MESSAGE" && action.payload) {
    return {
      ...state,
      message: action.payload,
    };
  }

  return state;
};

// motion variants
export const container = {
  enter: {
    width: "0",
  },
  show: {
    width: "auto",
  },
  exit: {
    width: "0",
  },
} as Variants;

export const item = {
  enter: {
    opacity: 0,
    filter: "blur(10px)",
  },
  show: {
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    filter: "blur(10px)",
  },
} as Variants;
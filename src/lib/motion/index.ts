import { Transition } from "motion/react";

// export const spring = (props: typeof motionSpring) =>
//   motionSpring({
//     keyframes: [0, 1],
//     bounce: 0.125,
//     duration: 0.5,
//     ...props,
//   });

export const spring = (params: Partial<Transition> = {}): Transition => ({
  type: "spring",
  bounce: 0.125,
  duration: 0.5,
  ...params,
});

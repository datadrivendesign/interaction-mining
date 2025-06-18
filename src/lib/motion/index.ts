// export const spring = (props: typeof motionSpring) =>
//   motionSpring({
//     keyframes: [0, 1],
//     bounce: 0.125,
//     duration: 0.5,
//     ...props,
//   });

export const spring = (params?: any) => ({
  type: "spring",
  bounce: 0.125,
  duration: 0.5,
  ...params,
})
import { LazyMotion } from "motion/react";
import { PropsWithChildren } from "react";

const loadFeatures = () =>
  import("motion/react").then((res) => res.domAnimation);

export const CustomLazyMotion = ({ children }: PropsWithChildren) => {
  return (
    <LazyMotion strict features={loadFeatures}>
      {children}
    </LazyMotion>
  );
};

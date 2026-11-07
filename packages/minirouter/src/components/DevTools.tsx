import React from "react";

import { useNavigationContext } from "../useNavigationContext";

export const DevTools: React.FC = () => {
  const { currentStep, childSteps, parentSteps } = useNavigationContext();
  return (
    <div style={{ padding: "0em", opacity: 0.5 }}>
      {parentSteps.map((s) => s.direction.description).join("→")}
      {" [ "}
      {currentStep?.direction.description ?? "none"}
      {" ] "}
      {childSteps.map((s) => s.direction.description).join("→")}
    </div>
  );
};

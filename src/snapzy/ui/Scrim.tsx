import type React from "react";

// A soft darkening behind a headline that sits over windows. No backdrop
// blur: a full-screen blur is the most expensive thing to render here.
export const Scrim: React.FC<{ amount: number }> = ({ amount }) =>
  amount > 0.002 ? (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse at 50% 42%, rgba(4,8,40,${0.72 * amount}), rgba(4,8,40,${0.5 * amount}) 70%)`,
      }}
    />
  ) : null;

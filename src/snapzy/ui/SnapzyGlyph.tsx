import type React from "react";

// The four-petal mark from Snapzy's icon, as a flat glyph for the menu bar.

export const SnapzyGlyph: React.FC<{ size: number; color?: string }> = ({ size, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path
      d="M12 7.2C9.6 2.2 3.4 1.6 2.6 4.4 1.8 7 5.2 10.4 7.4 12 5.2 13.6 1.8 17 2.6 19.6c.8 2.8 7 2.2 9.4-2.8 2.4 5 8.6 5.6 9.4 2.8.8-2.6-2.6-6-4.8-7.6 2.2-1.6 5.6-5 4.8-7.6-.8-2.8-7-2.2-9.4 2.8Z"
      fill={color}
    />
  </svg>
);

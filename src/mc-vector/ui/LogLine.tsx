import type React from "react";
import { colors, fonts } from "../theme";

export type LogLevel = "INFO" | "WARN" | "ERROR";

const LEVEL_COLOR: Record<LogLevel, string> = {
  INFO: colors.textSecondary,
  WARN: colors.warning,
  ERROR: colors.danger,
};

/** Wraps regex matches of `highlight` in a marker. */
const renderHighlighted = (text: string, highlight?: RegExp): React.ReactNode => {
  if (!highlight) {
    return text;
  }
  const flags = highlight.flags.includes("g") ? highlight.flags : `${highlight.flags}g`;
  const re = new RegExp(highlight.source, flags);
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    parts.push(text.slice(last, m.index));
    parts.push(
      <mark
        key={m.index}
        style={{ background: `${colors.warning}55`, color: colors.text, borderRadius: 3, padding: "0 2px" }}
      >
        {m[0]}
      </mark>,
    );
    last = m.index + m[0].length;
  }
  parts.push(text.slice(last));
  return parts;
};

export const LogLine: React.FC<{
  time: string;
  level?: LogLevel;
  thread?: string;
  message: string;
  highlight?: RegExp;
  /** 0..1 entry animation progress. */
  progress?: number;
  dimmed?: boolean;
  fontSize?: number;
  style?: React.CSSProperties;
}> = ({ time, level = "INFO", thread = "Server thread", message, highlight, progress = 1, dimmed = false, fontSize = 16, style }) => {
  const color = LEVEL_COLOR[level];
  const lineColor = level === "INFO" ? colors.editorText : color;
  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize,
        lineHeight: 1.6,
        whiteSpace: "pre",
        color: lineColor,
        opacity: progress * (dimmed ? 0.3 : 1),
        transform: `translateY(${(1 - progress) * 8}px)`,
        ...style,
      }}
    >
      <span style={{ color: colors.textFaint }}>[{time}] </span>
      <span style={{ color }}>
        [{thread}/{level}]
      </span>
      <span>: {renderHighlighted(message, highlight)}</span>
    </div>
  );
};

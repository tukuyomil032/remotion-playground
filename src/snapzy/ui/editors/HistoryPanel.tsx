import type { CSSProperties, FC, ReactNode } from "react";
import { FONT_TEXT, pt, ui } from "../../theme";
import { Icon, pressedStyle, type IconName } from "./kit";

export type HistoryFilter = "all" | "screenshots" | "videos" | "gifs";
export type HistoryRange = "any" | "24h" | "7d" | "30d";
export type HistoryItem = {
  id: string;
  kind: "screenshot" | "video" | "gif";
  label: string;
  ago: string;
  /** Thumbnail content; it fills the thumbnail box (cover). */
  content: ReactNode;
};

export type HistoryPanelProps = {
  width: number;
  height: number;
  filter: HistoryFilter;
  range: HistoryRange;
  items: HistoryItem[];
  selectedId?: string;
  /** Card that shows the blue "Restore" pill. */
  hoverId?: string;
  search?: string;
  /** "tab-videos", "range-7d", "close", "pin", "card-<id>", "restore" ... */
  pressed?: string;
  columns?: number;
};

const TABS: { id: HistoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "screenshots", label: "Screenshots" },
  { id: "videos", label: "Videos" },
  { id: "gifs", label: "GIFs" },
];

const RANGES: { id: HistoryRange; label: string }[] = [
  { id: "any", label: "Any Time" },
  { id: "24h", label: "24H" },
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
];

const FILTER_KIND: Record<HistoryFilter, HistoryItem["kind"] | null> = {
  all: null,
  screenshots: "screenshot",
  videos: "video",
  gifs: "gif",
};

const KIND_ICON: Record<HistoryItem["kind"], IconName> = {
  screenshot: "image",
  video: "video",
  gif: "film",
};

const TOP_H = pt(46);
const ROW_TOP = pt(18);
const ROW_H = TOP_H - pt(14);
const ROW_GAP = pt(10);
const SEARCH_MARGIN = pt(4);
const SIDE_PAD = pt(22);
const CARD_GAP = pt(14);
const CARD_PAD = pt(10);
const INFO_H = pt(62);
const THUMB_RATIO = 0.62;

const TAB_W: Record<HistoryFilter, number> = {
  all: pt(56),
  screenshots: pt(104),
  videos: pt(76),
  gifs: pt(62),
};
const RANGE_W: Record<HistoryRange, number> = { any: pt(86), "24h": pt(58), "7d": pt(52), "30d": pt(58) };
const ICON_COUNT = 3;
const DEFAULT_COLUMNS = 4;

const Tab: FC<{ label: string; selected: boolean; width: number; pressed?: boolean; style?: CSSProperties }> = ({
  label,
  selected,
  width,
  pressed,
  style,
}) => (
  <div
    style={{
      height: ROW_H,
      width,
      flex: "none",
      boxSizing: "border-box",
      justifyContent: "center",
      borderRadius: pt(20),
      display: "flex",
      alignItems: "center",
      fontSize: pt(13),
      fontWeight: 600,
      color: selected ? "#fff" : "#f0f0f4",
      background: selected ? ui.accent : "rgba(255,255,255,0.10)",
      boxShadow: selected ? "none" : "inset 0 0 0 1px rgba(255,255,255,0.06)",
      whiteSpace: "nowrap",
      ...pressedStyle(!!pressed),
      ...style,
    }}
  >
    {label}
  </div>
);

const IconBtn: FC<{ icon: IconName; pressed?: boolean }> = ({ icon, pressed }) => (
  <div
    style={{
      width: ROW_H,
      height: ROW_H,
      flex: "none",
      borderRadius: pt(20),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(255,255,255,0.10)",
      color: "#f0f0f4",
      ...pressedStyle(!!pressed),
    }}
  >
    <Icon name={icon} size={pt(15)} sw={1.9} />
  </div>
);

const Card: FC<{
  item: HistoryItem;
  width: number;
  selected: boolean;
  hover: boolean;
  pressed: boolean;
  restorePressed: boolean;
}> = ({ item, width, selected, hover, pressed, restorePressed }) => {
  const pad = CARD_PAD;
  const thumbH = (width - pad * 2) * THUMB_RATIO;
  return (
    <div
      style={{
        width,
        height: pad * 2 + thumbH + INFO_H,
        boxSizing: "border-box",
        padding: pad,
        borderRadius: pt(18),
        background: hover || selected ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.065)",
        boxShadow: selected
          ? `0 0 0 ${pt(2.5)}px ${ui.accent}`
          : "inset 0 0 0 1px rgba(255,255,255,0.07)",
        ...pressedStyle(pressed),
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: thumbH,
          borderRadius: pt(10),
          overflow: "hidden",
          background: "#14151b",
        }}
      >
        <div style={{ position: "absolute", inset: 0 }}>{item.content}</div>
        <div
          style={{
            position: "absolute",
            right: pt(8),
            bottom: pt(8),
            width: pt(22),
            height: pt(22),
            borderRadius: pt(7),
            background: "rgba(20,21,28,0.72)",
            color: "#e8e8ee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
          }}
        >
          <Icon name={KIND_ICON[item.kind]} size={pt(13)} sw={1.9} />
        </div>
      </div>
      <div style={{ height: INFO_H, overflow: "hidden" }}>
      {hover ? (
        <div style={{ display: "flex", justifyContent: "center", marginTop: pt(9) }}>
          <div
            style={{
              height: pt(28),
              padding: `0 ${pt(16)}px`,
              borderRadius: pt(14),
              background: ui.accent,
              color: "#fff",
              fontSize: pt(13),
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: pt(7),
              ...pressedStyle(restorePressed),
            }}
          >
            <Icon name="rotateL" size={pt(14)} sw={2} />
            Restore
          </div>
        </div>
      ) : (
        <div
          style={{
            marginTop: pt(9),
            fontSize: pt(13),
            fontWeight: 600,
            color: "#f4f4f8",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.label}
        </div>
      )}
      <div style={{ marginTop: pt(hover ? 8 : 3), fontSize: pt(12), color: ui.secondary, textAlign: hover ? "center" : "left" }}>
        {item.ago}
      </div>
      </div>
    </div>
  );
};

/** Pure geometry of the panel, from the same constants the component renders with. */
const historyLayout = (width: number, columns: number) => {
  const cardW = (width - SIDE_PAD * 2 - CARD_GAP * (columns - 1)) / columns;
  const cardH = CARD_PAD * 2 + (cardW - CARD_PAD * 2) * THUMB_RATIO + INFO_H;
  return { cardW, cardH, gridTop: ROW_TOP + TOP_H };
};

export type HistoryHotspots = {
  tabs: Record<HistoryFilter, { x: number; y: number }>;
  ranges: Record<HistoryRange, { x: number; y: number }>;
  /** Rects of the first `count` cards (unfiltered order), px relative to the panel's top-left. */
  cards: { x: number; y: number; w: number; h: number }[];
  search: { x: number; y: number };
};

export const historyHotspots = (p: {
  width: number;
  height: number;
  columns?: number;
  count: number;
}): HistoryHotspots => {
  const columns = p.columns ?? DEFAULT_COLUMNS;
  const rowY = ROW_TOP + ROW_H / 2;
  const tabs = {} as HistoryHotspots["tabs"];
  let x = SIDE_PAD;
  for (const t of TABS) {
    tabs[t.id] = { x: x + TAB_W[t.id] / 2, y: rowY };
    x += TAB_W[t.id] + ROW_GAP;
  }
  const searchLeft = x + SEARCH_MARGIN;
  const rangesTotal = RANGES.reduce((s, r) => s + RANGE_W[r.id], 0) + (RANGES.length - 1) * ROW_GAP;
  const iconsTotal = ICON_COUNT * ROW_H + (ICON_COUNT - 1) * ROW_GAP;
  let rx = p.width - SIDE_PAD - iconsTotal - ROW_GAP - rangesTotal;
  const ranges = {} as HistoryHotspots["ranges"];
  for (const r of RANGES) {
    ranges[r.id] = { x: rx + RANGE_W[r.id] / 2, y: rowY };
    rx += RANGE_W[r.id] + ROW_GAP;
  }
  const searchRight = p.width - SIDE_PAD - iconsTotal - ROW_GAP - rangesTotal - ROW_GAP - SEARCH_MARGIN;
  const g = historyLayout(p.width, columns);
  const cards = Array.from({ length: p.count }, (_, i) => ({
    x: SIDE_PAD + (i % columns) * (g.cardW + CARD_GAP),
    y: g.gridTop + Math.floor(i / columns) * (g.cardH + CARD_GAP),
    w: g.cardW,
    h: g.cardH,
  }));
  return { tabs, ranges, cards, search: { x: (searchLeft + searchRight) / 2, y: rowY } };
};

/**
 * Capture history panel. Draws content only (no window background): wrap it in
 * a Glass component.
 */
export const HistoryPanel: FC<HistoryPanelProps> = ({
  width,
  height,
  filter,
  range,
  items,
  selectedId,
  hoverId,
  search = "",
  pressed,
  columns = DEFAULT_COLUMNS,
}) => {
  const pad = SIDE_PAD;
  const { cardW } = historyLayout(width, columns);
  const kind = FILTER_KIND[filter];
  const q = search.trim().toLowerCase();
  const shown = items.filter((it) => (kind === null || it.kind === kind) && (q === "" || it.label.toLowerCase().includes(q)));

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        fontFamily: FONT_TEXT,
        color: ui.text,
        fontSize: pt(13),
      }}
    >
      <div
        style={{
          position: "absolute",
          left: pad,
          right: pad,
          top: ROW_TOP,
          height: ROW_H,
          display: "flex",
          alignItems: "center",
          gap: ROW_GAP,
        }}
      >
        {TABS.map((t) => (
          <Tab
            key={t.id}
            label={t.label}
            width={TAB_W[t.id]}
            selected={t.id === filter}
            pressed={pressed === `tab-${t.id}`}
          />
        ))}
        <div
          style={{
            flex: 1,
            minWidth: pt(120),
            height: ROW_H,
            borderRadius: pt(20),
            background: "rgba(255,255,255,0.10)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            gap: pt(9),
            padding: `0 ${pt(14)}px`,
            boxSizing: "border-box",
            color: ui.secondary,
            fontSize: pt(13.5),
            marginLeft: SEARCH_MARGIN,
            marginRight: SEARCH_MARGIN,
          }}
        >
          <Icon name="search" size={pt(15)} sw={1.9} />
          <span style={{ color: search ? ui.text : ui.secondary, whiteSpace: "nowrap" }}>
            {search || "Search captures"}
          </span>
        </div>
        {RANGES.map((r) => (
          <Tab
            key={r.id}
            label={r.label}
            width={RANGE_W[r.id]}
            selected={r.id === range}
            pressed={pressed === `range-${r.id}`}
          />
        ))}
        <IconBtn icon="collapse" pressed={pressed === "collapse"} />
        <IconBtn icon="pin" pressed={pressed === "pin"} />
        <IconBtn icon="close" pressed={pressed === "close"} />
      </div>

      <div
        style={{
          position: "absolute",
          left: pad,
          top: ROW_TOP + TOP_H,
          width: width - pad * 2,
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, ${cardW}px)`,
          gap: CARD_GAP,
          alignContent: "start",
        }}
      >
        {shown.map((it) => (
          <Card
            key={it.id}
            item={it}
            width={cardW}
            selected={it.id === selectedId}
            hover={it.id === hoverId}
            pressed={pressed === `card-${it.id}`}
            restorePressed={pressed === "restore" && it.id === hoverId}
          />
        ))}
      </div>
    </div>
  );
};

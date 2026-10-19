// Scene-local frames of every click, key press and capture. Pure TypeScript:
// the scenes animate from these and layout.ts turns them into sound cues, so
// a click and its sound can never drift apart. Clicks are at least 50 frames
// (0.83 s) apart.

export const ONBOARD = {
  taps: [258, 360, 452, 544, 712] as const,
} as const;

export const OCR = {
  keys: 110,
  dragStart: 170,
  dragEnd: 250,
  scan: 262,
  lines: [278, 294, 310] as const,
  copied: 372,
  away: 520,
} as const;

export const HISTORY = {
  menuTap: 116,
  open: 186,
  tabScreens: 268,
  range7d: 330,
  hover: 384,
  restore: 444,
  close: 470,
} as const;

export const VIDEO = {
  open: 80,
  trimStart: [170, 222] as const,
  trimEnd: [276, 328] as const,
  addZoom: 386,
  play: 446,
  playEnd: 640,
  convert: 690,
  exported: 776,
  close: 796,
} as const;

export const ANNOTATE = {
  cardIn: 60,
  cardHover: 130,
  cardClick: 186,
  toolArrow: 262,
  arrow: [300, 360] as const,
  toolRect: 410,
  rect: [450, 500] as const,
  toolCounter: 550,
  counters: [600, 652] as const,
  toolBlur: 706,
  blur: [748, 800] as const,
  gradient: 860,
  padding: [912, 968] as const,
  corners: [1000, 1040] as const,
  mockup: 1090,
  done: 1144,
} as const;

export const CAPTURE = {
  /** Headline, then the windows arrive. */
  windowsIn: 70,
  // Tour of the menu.
  menuTap: 170,
  hover: [
    [206, "Capture Area"],
    [250, "Application Capture"],
    [290, "Capture Fullscreen"],
    [330, "Capture Active Window"],
    [370, "Delayed Capture (3s)"],
  ] as const,
  menuClose: 420,
  // 1. Area.
  areaKeys: 470,
  dragStart: 530,
  dragEnd: 640,
  areaShot: 650,
  // 2. Application window (A toggles window mode).
  appKeys: 740,
  appA: 800,
  appHoverNotes: 830,
  appHoverFinder: 880,
  appShot: 930,
  // 3. Fullscreen.
  fullKeys: 1010,
  fullShot: 1030,
  // 4. Active window, from the menu.
  activeMenuTap: 1120,
  activeClick: 1180,
  activeShot: 1200,
  // 5. Delayed capture, from the menu; the cursor opens a tooltip meanwhile.
  delayMenuTap: 1270,
  delayClick: 1330,
  count: [1350, 1410, 1470] as const,
  delayShot: 1530,
} as const;

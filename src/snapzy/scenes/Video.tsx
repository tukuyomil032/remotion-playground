import type React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { DeskSnapshot, DeskWindows, NOTES, SCREEN } from "../content/Desk";
import { Cursor } from "../desktop/Cursor";
import { cameraAt, Desktop, WIDE } from "../desktop/Desktop";
import { ease, mix, pathAt, pressAt, SMOOTH, SNAPPY, swift } from "../motion";
import { pt } from "../theme";
import { VIDEO as T } from "../timing";
import { VideoEditor, videoHotspots } from "../ui/editors/VideoEditor";
import { Headline } from "../ui/Headline";
import { Scrim } from "../ui/Scrim";

// Video (7 bars). The video editor opens on a screen recording. Drag the trim
// handles in, click the Zooms lane to add a 2x zoom, play it (the preview
// follows into the zoom), then Convert: the export ring fills and the editor
// closes.

const EW = pt(1120);
const EH = pt(700);
const EX = (1920 - EW) / 2;
const EY = (1080 - EH) / 2 + pt(8);
const CW = 1280;
const CH = 720;

const TRIM_IN = 0.12;
const TRIM_OUT = 0.86;
const ZOOM = { start: 0.38, end: 0.62 };
/** Where the zoom looks, in content coordinates (the note window). */
const FOCUS = { x: ((NOTES.x + NOTES.w * 0.45) / 1920) * CW, y: ((NOTES.y + NOTES.h * 0.45) / 1080) * CH };

const Recording: React.FC<{ zoom?: number }> = ({ zoom = 0 }) => {
  const s = 1 + zoom;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: `${FOCUS.x}px ${FOCUS.y}px`,
          transform: `scale(${s})`,
        }}
      >
        <DeskSnapshot region={SCREEN} width={CW} height={CH} />
      </div>
    </div>
  );
};

const clock = (sec: number): string => `00:${String(Math.floor(sec)).padStart(2, "0")}`;

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const head = swift(frame, fps, SMOOTH, 2) - swift(frame, fps, SMOOTH, 66);
  const open = swift(frame, fps, SNAPPY, T.open);
  const close = swift(frame, fps, SNAPPY, T.close);
  const show = open * (1 - close);

  const trimStart = mix(0, TRIM_IN, ease(frame, T.trimStart[0], T.trimStart[1]));
  const trimEnd = mix(1, TRIM_OUT, ease(frame, T.trimEnd[0], T.trimEnd[1]));
  const zoomIn = swift(frame, fps, SNAPPY, T.addZoom);
  const segments = frame >= T.addZoom ? [{ start: ZOOM.start, end: mix(ZOOM.start + 0.01, ZOOM.end, zoomIn), label: "2x" }] : [];
  const playing = frame >= T.play && frame < T.playEnd;
  const playhead = frame < T.play ? trimStart : mix(TRIM_IN, 0.8, ease(frame, T.play + 4, T.playEnd));
  // Zoom follows the playhead into and out of the segment.
  const zoom = Math.max(0, Math.min(1, (playhead - ZOOM.start) / 0.05)) * Math.max(0, Math.min(1, (ZOOM.end + 0.05 - playhead) / 0.05));
  const exportProgress = frame >= T.convert + 6 ? Math.min(1, ease(frame, T.convert + 8, T.exported)) : null;

  const hs = videoHotspots({ width: EW, height: EH, contentWidth: CW, contentHeight: CH });
  const tx = (t: number) => EX + hs.trackX0 + t * (hs.trackX1 - hs.trackX0);
  const trackY = EY + hs.trackY;
  const laneY = EY + hs.zoomLaneY;
  const play = { x: EX + hs.play.x, y: EY + hs.play.y };
  const convert = { x: EX + hs.convert.x, y: EY + hs.convert.y };

  const cursor = pathAt(frame, [
    [0, 1300, 780],
    [T.trimStart[0] - 6, tx(0), trackY],
    [T.trimStart[1], tx(TRIM_IN), trackY],
    [T.trimEnd[0] - 6, tx(1), trackY],
    [T.trimEnd[1], tx(TRIM_OUT), trackY],
    [T.addZoom - 6, tx(ZOOM.start + 0.02), laneY],
    [T.play - 6, play.x, play.y],
    [T.convert - 6, convert.x, convert.y],
    [T.close + 30, convert.x - 100, convert.y - 140],
  ]);
  const clicks = [T.trimStart[0], T.trimEnd[0], T.addZoom, T.play, T.convert];
  const press = clicks.reduce((p, t) => Math.max(p, pressAt(frame, t)), 0);
  let pressed: string | undefined;
  if (frame >= T.trimStart[0] && frame <= T.trimStart[1]) pressed = "trim-start";
  if (frame >= T.trimEnd[0] && frame <= T.trimEnd[1]) pressed = "trim-end";
  if (Math.abs(frame - T.play) < 6) pressed = "play";
  if (Math.abs(frame - T.convert) < 6) pressed = "convert";

  const timelineCam = { x: EX + EW * 0.55, y: EY + EH * 0.72, scale: 1.3 };
  const camera = cameraAt(frame, [
    [0, WIDE],
    [T.trimStart[0] - 40, WIDE],
    [T.trimStart[0] - 6, timelineCam],
    [T.addZoom + 20, timelineCam],
    [T.play + 20, WIDE],
  ]);

  const p = hs.preview;
  return (
    <Desktop
      scene="video"
      camera={camera}
      dockHide={show}
      overlay={
        <>
          <DeskWindows />
          {show > 0.002 ? (
            <div
              style={{
                position: "absolute",
                left: EX,
                top: EY,
                width: EW,
                height: EH,
                opacity: Math.min(1, show * 1.4),
                transform: `scale(${0.94 + 0.06 * show})`,
                borderRadius: pt(22),
                boxShadow: "0 30px 90px rgba(0,0,40,0.5)",
              }}
            >
              <VideoEditor
                width={EW}
                height={EH}
                trimStart={trimStart}
                trimEnd={trimEnd}
                playhead={playhead}
                playing={playing}
                zoomSegments={segments}
                exportProgress={exportProgress}
                timeLabel={clock(playhead * 14)}
                durationLabel={clock((trimEnd - trimStart) * 14)}
                pressed={pressed}
                contentWidth={CW}
                contentHeight={CH}
                title="Screen Recording.mp4"
                actionLabel="Convert"
              >
                <Recording />
              </VideoEditor>
              {/* The live preview, zoomed (the strip keeps the plain frames). */}
              {exportProgress === null ? (
                <div style={{ position: "absolute", left: p.x, top: p.y, width: p.w, height: p.h, overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH, transformOrigin: "0 0", transform: `scale(${p.w / CW}, ${p.h / CH})` }}>
                    <Recording zoom={zoom} />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          {frame > 100 && frame < T.close + 30 ? (
            <Cursor x={cursor.x} y={cursor.y} press={press} opacity={ease(frame, 100, 116) * (1 - ease(frame, T.close + 10, T.close + 28))} />
          ) : null}
        </>
      }
      screen={
        <>
          <Scrim amount={head} />
          <Headline title="Trim and zoom." sub="Edit recordings, then export MP4 or GIF." show={head} y={pt(300)} />
        </>
      }
    />
  );
};

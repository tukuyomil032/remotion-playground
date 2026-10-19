import type React from "react";
import { Sequence } from "remotion";
import type { DoodleKind } from "./Doodle";
import { TitleCard } from "./TitleCard";

// The five feature title scenes (one bar each, butter background).
// Each one mounts its own Sequence; pass the beat's from / durationInFrames.

type BeatProps = { from: number; durationInFrames: number };

type TitleSpec = {
  n: number;
  title: string;
  em: string;
  sub: string;
  doodle: DoodleKind;
};

const TOTAL = 5;

const TitleBeat: React.FC<BeatProps & { spec: TitleSpec }> = ({ from, durationInFrames, spec }) => (
  <Sequence from={from} durationInFrames={durationInFrames} name={`title${spec.n} ${spec.title}`}>
    <TitleCard
      n={spec.n}
      total={TOTAL}
      title={spec.title}
      em={spec.em}
      sub={spec.sub}
      doodle={spec.doodle}
      durationInFrames={durationInFrames}
    />
  </Sequence>
);

const CREATE: TitleSpec = {
  n: 1,
  title: "Create.",
  em: "in one form",
  sub: "Pick a type and a version. The jar downloads for you.",
  doodle: "form",
};

const RUN: TitleSpec = {
  n: 2,
  title: "Run.",
  em: "watch it live",
  sub: "Start, stop, and watch TPS, CPU and memory in real time.",
  doodle: "pulse",
};

const EXTEND: TitleSpec = {
  n: 3,
  title: "Extend.",
  em: "one click",
  sub: "Search Modrinth, Hangar and SpigotMC. Install in one click.",
  doodle: "puzzle",
};

const BACKUP: TitleSpec = {
  n: 4,
  title: "Back up.",
  em: "restore anytime",
  sub: "Back up your world and restore it when you need to.",
  doodle: "box",
};

const SHARE: TitleSpec = {
  n: 5,
  title: "Share.",
  em: "no port forwarding",
  sub: "Share with friends through an ngrok tunnel.",
  doodle: "link",
};

export const Title1: React.FC<BeatProps> = (props) => <TitleBeat {...props} spec={CREATE} />;
export const Title2: React.FC<BeatProps> = (props) => <TitleBeat {...props} spec={RUN} />;
export const Title3: React.FC<BeatProps> = (props) => <TitleBeat {...props} spec={EXTEND} />;
export const Title4: React.FC<BeatProps> = (props) => <TitleBeat {...props} spec={BACKUP} />;
export const Title5: React.FC<BeatProps> = (props) => <TitleBeat {...props} spec={SHARE} />;

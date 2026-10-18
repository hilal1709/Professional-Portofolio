"use client";

import { Player } from "@remotion/player";
import { getShowreelDuration, SHOWREEL, Showreel, type ShowreelProps } from "@/remotion/Showreel";

/** Dimuat terpisah (dynamic import) karena Remotion adalah paket terbesar di halaman. */
export default function ReelPlayer({ inputProps }: { inputProps: ShowreelProps }) {
  return (
    <Player
      component={Showreel}
      inputProps={inputProps}
      durationInFrames={getShowreelDuration(inputProps)}
      fps={SHOWREEL.fps}
      compositionWidth={SHOWREEL.width}
      compositionHeight={SHOWREEL.height}
      style={{ width: "100%", aspectRatio: `${SHOWREEL.width} / ${SHOWREEL.height}` }}
      initialFrame={60}
      clickToPlay
      controls
      loop
      acknowledgeRemotionLicense
    />
  );
}

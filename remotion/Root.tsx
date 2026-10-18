import { Composition } from "remotion";
import { getShowreelDuration, SHOWREEL, Showreel, showreelDefaults, type ShowreelProps } from "../src/remotion/Showreel";

export const RemotionRoot = () => {
  return (
    <Composition
      id="Showreel"
      component={Showreel}
      fps={SHOWREEL.fps}
      width={SHOWREEL.width}
      height={SHOWREEL.height}
      // Studio/render memakai data asli lewat --props (lihat `npm run remotion:props`).
      defaultProps={showreelDefaults}
      durationInFrames={getShowreelDuration(showreelDefaults)}
      calculateMetadata={({ props }: { props: ShowreelProps }) => ({ durationInFrames: getShowreelDuration(props) })}
    />
  );
};

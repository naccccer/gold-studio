import { Composition, Folder } from "remotion";
import { GoldStudioLaunch } from "./videos/gold-studio-launch";

export const RemotionRoot = () => {
  return (
    <Folder name="Marketing">
      <Composition
        id="GoldStudioLaunch"
        component={GoldStudioLaunch}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
      />
    </Folder>
  );
};

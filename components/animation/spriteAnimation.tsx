//Imports
import { useEffect, useState } from "react";
import { Image, View, type ImageSourcePropType } from "react-native";

// SPRITE ANIMATION
// Shows a list of images one after the other.
// All frames are drawn on top of each other and only the current one is visible:
// that way every image is already loaded, so there is no flicker.
//
// Examples:
//   Always looping ........ <SpriteAnimation frames={IDLE} />
//   Play once on demand ... <SpriteAnimation frames={SLURP} playing={playing} loop={false} onFinish={() => setPlaying(false)} />

type Props = {
  frames: ImageSourcePropType[]; // the images, in order
  fps?: number;                  // frames per second (speed)
  size?: number;                 // width and height on screen
  playing?: boolean;             // true = animating, false = shows the first frame (default: true)
  loop?: boolean;                // true = starts over forever, false = plays once (default: true)
  onFinish?: () => void;         // called when a non-looping animation reaches its end
};

export default function SpriteAnimation({
  frames,
  fps = 6,
  size = 150,
  playing = true,
  loop = true,
  onFinish,
}: Props) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!playing) return; // not playing: nothing to do, the first frame is shown (see `shown` below)

    let index = 0; // frame 0 is already on screen, the first tick shows frame 1
    const timer = setInterval(() => {
      index++;

      // Reached the end
      if (index >= frames.length) {
        if (loop) {
          index = 0; // start over
        } else {
          clearInterval(timer); // stop, back to the first frame, tell the parent
          setCurrent(0);
          onFinish?.();
          return;
        }
      }

      setCurrent(index);
    }, 1000 / fps);

    // Cleanup: runs when playing stops or the component disappears
    return () => {
      clearInterval(timer);
      setCurrent(0); // next play starts from the first frame
    };
  }, [playing, loop, fps, frames.length]);

  // Not playing -> always show the first frame
  const shown = playing ? current : 0;

  return (
    <View style={{ width: size, height: size }}>
      {frames.map((frame, index) => (
        <Image
          key={index}
          source={frame}
          style={{
            position: "absolute",
            width: size,
            height: size,
            opacity: index === shown ? 1 : 0,
          }}
          resizeMode="contain"
        />
      ))}
    </View>
  );
}
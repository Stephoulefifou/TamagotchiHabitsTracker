//Imports
import { useState } from "react";
import { Image, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

// SETTINGS
const SIZE = 224; // size of the egg on screen

// The 4 states of the egg: normal, a bit broken, nearly broken, broken
const FRAMES = [
  require("./animation/eggHatching/egg_hatching_1.png"),
  require("./animation/eggHatching/egg_hatching_2.png"),
  require("./animation/eggHatching/egg_hatching_3.png"),
  require("./animation/eggHatching/egg_hatching_4.png"),
];

// EGG HATCHING
// Each tap breaks the egg a bit more, with a shake. On the last tap, the egg breaks.

type Props = {
  onHatched?: () => void; // called when the egg is broken (to show the slime, later)
};

export default function EggHatching({ onHatched }: Props) {
  // Which frame is shown (0 = normal egg)
  const [eggState, setEggState] = useState(0);

  // The angle of the egg, for the rocking (in degrees)
  const angle = useSharedValue(0);

  // Tilts left, right, left, back straight. A bigger strength = a bigger rock.
  function shake(strength: number) {
    angle.set(
      withSequence(
        withTiming(-strength, { duration: 80 }),
        withTiming(strength, { duration: 80 }),
        withTiming(-strength / 2, { duration: 80 }),
        withTiming(0, { duration: 80 }),
      ),
    );
  }

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: SIZE / 2 }, // 1. move the egg down: its base is now at the center
      { rotate: `${angle.get()}deg` }, // 2. rotate around that point (= the base)
      { translateY: -SIZE / 2 }, // 3. move it back up
    ],
  }));
  // One tap = one step
  function tapEgg() {
    if (eggState >= FRAMES.length - 1) return;

    const next = eggState + 1;
    setEggState(next);

    if (next === 1) {
      shake(4); // a bit broken: small shake
    } else if (next === 2) {
      shake(8); // nearly broken: bigger shake
    } else if (next === 3) {
      shake(1); // broken: biggest shake
      setTimeout(() => onHatched?.(), 600); // let the broken egg show a moment, then hatch
    }
  }

  return (
    <View>
      <Animated.View style={style}>
        <Pressable onPress={tapEgg}>
          <Image
            source={FRAMES[eggState]}
            style={{ width: SIZE, height: SIZE }}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

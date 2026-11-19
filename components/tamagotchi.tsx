//Imports
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import SpriteAnimation from "./animation/spriteAnimation";
import {
  FRAMES,
  type AnimationName,
  type SlimeColor,
} from "./animation/frames";
import { useHabits } from "../pages/flatlist/HabitsContext";
import { bodySize, currentFullness, MAX_FULLNESS } from "./fullness";

// SETTINGS

const SIZE = 224; // size of the pet on screen (28 x 8)
const IDLE_FPS = 4; // speed of the idle and sleep animations (calm)
const EAT_FPS = 10; // speed of the eat animation (lively)

const MIN_REPEATS = 3; // an idle animation plays at least this many times...
const MAX_REPEATS = 6; // ...and at most this many times, before switching to another one

const SLEEP_AFTER = 30_000; // falls asleep after 30 seconds without touching the screen (ms)

const SCALE = { skinny: 0.8, normal: 1, big: 1.25 };

// The idle animations the pet switches between, at random.
// "mirrored" flips the image, so the side animation can look left AND right.
type Idle = { animation: AnimationName; mirrored: boolean };

const IDLES: Idle[] = [
  { animation: "idleFront", mirrored: false },
  { animation: "idleBack", mirrored: false },
  { animation: "idleSide", mirrored: false },
  { animation: "idleSide", mirrored: true },
];

// HELPERS

// A random whole number between min and max (both included)
function randomBetween(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// Picks a random idle animation, different from the current one
function pickIdle(current?: Idle): Idle {
  const others = IDLES.filter((idle) => idle !== current);
  return others[Math.floor(Math.random() * others.length)];
}

// How long an animation lasts when it plays `repeats` times (ms)
function duration(animation: AnimationName, repeats: number): number {
  return (FRAMES.purple[animation].length / IDLE_FPS) * 1000 * repeats;
}

// TAMAGOTCHI
// The pet and its "Give an apple" button.
//   sleep: when you arrive on the screen, and after a long time without touching it
//   awake: switches between front, back and side (both ways), at random
//   eat:   once, when you give an apple. Then the pet is awake.

type Mode = "sleep" | "awake" | "eat";
type Props = {
  color: SlimeColor; // the pet's color, chosen at hatching
};
export default function Tamagotchi({ color }: Props) {
  const { apples, fullness, feedPet } = useHabits();

  // The time now, updated every minute (so the body size changes by itself)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const size = bodySize(fullness, now);
  const full = currentFullness(fullness, now) >= MAX_FULLNESS;

  // What the pet is doing
  const [mode, setMode] = useState<Mode>("sleep");
  // The current idle animation (when awake)
  const [idle, setIdle] = useState<Idle>(() => pickIdle());
  // Goes up at every touch on the screen (restarts the "fall asleep" countdown)
  const [touches, setTouches] = useState(0);

  // Arriving on the screen -> the pet is asleep
  useFocusEffect(
    useCallback(() => {
      setMode("sleep");
    }, []),
  );

  // Awake: after a few repeats, switch to another idle animation
  useEffect(() => {
    if (mode !== "awake") return;
    const repeats = randomBetween(MIN_REPEATS, MAX_REPEATS);
    const timer = setTimeout(
      () => setIdle((current) => pickIdle(current)),
      duration(idle.animation, repeats),
    );
    return () => clearTimeout(timer);
  }, [mode, idle]);

  // Awake: no touch for a while -> falls asleep
  useEffect(() => {
    if (mode !== "awake") return;
    const timer = setTimeout(() => setMode("sleep"), SLEEP_AFTER);
    return () => clearTimeout(timer); // a new touch came: the countdown starts again
  }, [mode, touches]);

  // Feeding costs 1 apple: the pet only eats if the apple was paid
  function feed() {
    if (feedPet()) {
      setMode("eat");
    }
  }

  // Which animation to show, depending on the mode
  const animation: AnimationName =
    mode === "sleep" ? "idleSleep" : mode === "eat" ? "slurp" : idle.animation;
  const mirrored = mode === "awake" && idle.mirrored;

  return (
    // Any touch on the pet or the buttons restarts the "fall asleep" countdown
    <View
      style={{ alignItems: "center", gap: 16 }}
      onTouchStart={() => setTouches((count) => count + 1)}
    >
      {/* scaleX: -1 flips the image, so the side animation looks the other way */}
      <View
        style={{ transform: [{ scaleX: (mirrored ? -1 : 1) * SCALE[size] }] }}
      >
        <SpriteAnimation
          // A new key = a fresh animation, starting at its first frame
          key={`${color}-${animation}-${mode}-${idle.mirrored}`}
          frames={FRAMES[color][animation]}
          fps={mode === "eat" ? EAT_FPS : IDLE_FPS}
          size={SIZE}
          loop={mode !== "eat"}
          onFinish={() => setMode("awake")} // only used by "eat" (the others loop)
        />
      </View>

      {/* Disabled while eating, or with no apples */}
      <Button
        mode="contained"
        icon="food-apple"
        onPress={feed}
        disabled={mode === "eat" || apples === 0 || full}
      >
        {full ? "I'm full!" : "Give an apple"}
      </Button>
    </View>
  );
}

//Imports
import { useState } from "react";
import { View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import Tamagotchi from "../components/tamagotchi";
import SpriteAnimation from "../components/animation/spriteAnimation";

// ANIMATIONS
// Each animation is a list of frames, in order (each image needs its own require).

const SLURP = [
  require("../components/animation/slurp/frame0001.png"),
  require("../components/animation/slurp/frame0003.png"),
  require("../components/animation/slurp/frame0005.png"),
  require("../components/animation/slurp/frame0007.png"),
];

// HOME PAGE

export default function Home() {
  const theme = useTheme();

  // Is the slurp animation playing right now?
  const [playing, setPlaying] = useState(false);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        backgroundColor: theme.colors.background,
      }}
    >
      <Tamagotchi />

      {/* White square behind the animation */}
      <View style={{ backgroundColor: "white", padding: 12, borderRadius: 16 }}>
        {/* Plays the 4 frames once, then rests on the first frame */}
        <SpriteAnimation
          frames={SLURP}
          fps={6}
          size={200}
          playing={playing}                  // starts when the button sets it to true
          loop={false}                       // plays once
          onFinish={() => setPlaying(false)} // ready to be played again
        />
      </View>

      {/* Disabled while the animation is playing */}
      <Button mode="contained" icon="play" onPress={() => setPlaying(true)} disabled={playing}>
        Give an apple
      </Button>
    </View>
  );
}
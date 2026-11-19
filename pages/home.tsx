//Imports
import { useState } from "react";
import { Alert, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import Tamagotchi from "../components/tamagotchi";
import EggHatching from "../components/eggHatching";
import { getRandomName } from "../components/randomName";
import { COLORS } from "../components/animation/frames";
import { useHabits } from "./flatlist/HabitsContext";

// HOME PAGE
// No pet yet -> the egg. After hatching -> the slime, with its name.

export default function Home() {
  const theme = useTheme();
  const { loaded, pet, hatchPet, resetAccount } = useHabits();

  // true right after hatching, to say hello to the new pet
  const [justHatched, setJustHatched] = useState(false);

  // The egg broke: random name (API) + random color -> the pet is born
  async function hatch() {
    const name = await getRandomName();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    hatchPet(name, color);
    setJustHatched(true);
  }

  // TESTING: back to the egg, after a confirmation
  function confirmReset() {
    Alert.alert("Reset the account?", "Your pet, habits and apples will be reset.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          resetAccount();
          setJustHatched(false);
        },
      },
    ]);
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
        backgroundColor: theme.colors.background,
      }}
    >
      {!loaded ? null : pet ? (
        // The pet is born
        <>
          <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
            {justHatched ? `Meet ${pet.name}, your ${pet.color} slime!` : pet.name}
          </Text>
          <Tamagotchi color={pet.color} />
        </>
      ) : (
        // Not born yet: the egg
        <>
          <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
            Tap the egg to hatch it!
          </Text>
          <EggHatching onHatched={hatch} />
        </>
      )}

      {/* TESTING: remove before submitting */}
      <Button mode="outlined" icon="restart" onPress={confirmReset}>
        Reset account (testing)
      </Button>
    </View>
  );
}
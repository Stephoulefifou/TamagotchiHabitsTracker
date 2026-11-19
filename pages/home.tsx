//Imports
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import Tamagotchi from "../components/tamagotchi";
import { getRandomName } from "../components/randomName";
import { Button } from "react-native-paper";
import EggHatching from "../components/eggHatching";


// HOME PAGE
// Shows the pet. Everything about the pet (animations, feeding) is in components/tamagotchi.tsx.

export default function Home() {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.colors.background,
      }}
    >
      <EggHatching onHatched={() => console.log("Hatched!")} />
      <Tamagotchi />
      <Button onPress={async () => console.log(await getRandomName())}>Test name</Button>
    </View>
  );
}
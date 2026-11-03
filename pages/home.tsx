import { View } from "react-native";
import { useTheme } from "react-native-paper";
import Tamagotchi from "../components/tamagotchi";

export default function Home() {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
      <Tamagotchi />
    </View>
  );
}

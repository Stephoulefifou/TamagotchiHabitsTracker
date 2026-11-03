import { View, Text, Button } from "react-native";
import Tamagotchi from "../components/tamagotchi";
import { colors } from "../components/colors";

export default function Home({ navigation }: { navigation: any }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
      <Tamagotchi />
    </View>
  );
}
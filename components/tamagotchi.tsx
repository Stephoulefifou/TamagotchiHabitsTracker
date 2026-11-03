import { View, Image } from "react-native";

export default function Tamagotchi() {
  return (
    <View style={{ alignItems: "center", marginTop: 20 }}>
      <Image
        style={{ width: 250, height: 250 }}
        source={require("./TamagotchiImage/tama.png")}
        resizeMode="contain"
      />
    </View>
  );
}
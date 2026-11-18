//Imports
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Icon, Surface, Text, useTheme } from "react-native-paper";
import Animated, {
  FadeInRight,
  FadeOutUp,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHabits } from "../pages/flatlist/HabitsContext";

// SETTINGS
const SHOW_CHANGE_FOR = 900; // how long "+7" stays before the number updates (ms)

// APPLE COUNTER
// Waits for the saved data, so it doesn't animate "+157" when the app opens.
export default function AppleCounter() {
  const { loaded } = useHabits();
  if (!loaded) return null;
  return <Counter />;
}

function Counter() {
  const { apples } = useHabits();
  const theme = useTheme();
  const insets = useSafeAreaInsets(); // space taken by the status bar

  // The number on screen. It follows `apples`, but a bit later.
  const [shown, setShown] = useState(apples);

  // The difference between the real apples and the number on screen: +7, -1, or 0
  const change = apples - shown;

  // When there is a change, wait a bit, then update the number on screen
  useEffect(() => {
    if (change === 0) return;
    const timer = setTimeout(() => setShown(apples), SHOW_CHANGE_FOR);
    return () => clearTimeout(timer); // another change came first: start the wait again
  }, [apples, change]);

  return (
    <Surface elevation={2} style={[styles.box, { top: insets.top + 8 }]}>
      <Icon source="food-apple" size={18} color={theme.colors.primary} />

      {/* The number. key={shown} makes it "new" each time, so it pops */}
      <Animated.View key={shown} entering={ZoomIn}>
        <Text variant="titleMedium" style={styles.number}>
          {shown}
        </Text>
      </Animated.View>

      {/* The change: +7 in green, -1 in red. Slides in, then fades away */}
      <View style={styles.changeSlot}>
        {change !== 0 && (
          <Animated.View entering={FadeInRight} exiting={FadeOutUp}>
            <Text
              variant="titleMedium"
              style={{
                color: change > 0 ? "#4caf50" : theme.colors.error,
                fontWeight: "bold",
              }}
            >
              {change > 0 ? `+${change}` : change}
            </Text>
          </Animated.View>
        )}
      </View>
    </Surface>
  );
}

// STYLES

const styles = StyleSheet.create({
  box: {
    position: "absolute", // floats above the screens
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  number: {
    fontWeight: "bold",
  },
  changeSlot: {
  width: 20, // room for "+7" or "-1"
},
});

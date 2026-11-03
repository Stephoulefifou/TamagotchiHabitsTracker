import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeBottomTabNavigator } from "@react-navigation/bottom-tabs/unstable";
import { StyleSheet } from "react-native";
import { HabitsProvider } from "./pages/flatlist/HabitsContext";
import {
  SafeAreaView,
  SafeAreaProvider,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import habits from "./pages/habits";
import home from "./pages/home";
import { colors } from "./components/colors";

const Tab = createNativeBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <HabitsProvider>
        <NavigationContainer theme={DarkTheme}>
          <Tab.Navigator
            screenLayout={({ children }) => (
              <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
                {children}
              </SafeAreaView>
            )}
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.secondary,
              tabBarStyle: { backgroundColor: colors.nav_background },
            }}
          >
            <Tab.Screen
              name="Home"
              component={home}
              options={{
                tabBarIcon: {
                  type: "image",
                  source: require("./components/icons/creature.png"),
                },
              }}
            />
            <Tab.Screen
              name="Habits"
              component={habits}
              options={{
                tabBarIcon: {
                  type: "image",
                  source: require("./components/icons/habits.png"),
                },
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </HabitsProvider>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({});

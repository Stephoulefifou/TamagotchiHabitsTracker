import { NavigationContainer } from "@react-navigation/native";
import { createNativeBottomTabNavigator } from "@react-navigation/bottom-tabs/unstable";
import { PaperProvider } from "react-native-paper";
import { HabitsProvider } from "./pages/flatlist/HabitsContext";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import AppleCounter from "./components/appleCounter";
import BurgerMenu from "./components/burgermenu";

import habits from "./pages/habits";
import home from "./pages/home";
import { colors } from "./components/colors";
import { theme, navigationTheme } from "./components/theme";
import HabitNotifications from "./pages/flatlist/habitNotifications";

const Tab = createNativeBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <HabitsProvider>
          <HabitNotifications />
          <NavigationContainer theme={navigationTheme}>
            
            <Tab.Navigator
              screenLayout={({ children }) => (
                <SafeAreaView
                  edges={["top"]}
                  style={{ flex: 1, backgroundColor: theme.colors.background }}
                >
                  {children}
                </SafeAreaView>
              )}
              // The native tab bar is not a Paper component, so it gets the colors directly
              screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.secondary,
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
          <AppleCounter />
          <BurgerMenu />
        </HabitsProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

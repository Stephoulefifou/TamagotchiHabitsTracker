//Imports
import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeBottomTabNavigator } from "@react-navigation/bottom-tabs/unstable";
import { PaperProvider } from "react-native-paper";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
// Firebase authentification
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebaseConfig";

import { HabitsProvider } from "./pages/flatlist/HabitsContext";
import HabitNotifications from "./pages/flatlist/habitNotifications";
import AppleCounter from "./components/appleCounter";
import BurgerMenu from "./components/burgerMenu";
import Login from "./pages/login";
import habits from "./pages/habits";
import home from "./pages/home";
import { colors } from "./components/colors";
import { theme, navigationTheme } from "./components/theme";

const Tab = createNativeBottomTabNavigator();

export default function App() {
  // The logged-in user, or null when nobody is logged in
  const [user, setUser] = useState<User | null>(null);
  // true while Firebase checks if someone is already logged in
  const [checking, setChecking] = useState(true);

  // Firebase calls this when the app opens, and every time someone logs in or out
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setChecking(false);
    });
    return unsubscribe; // stop listening when App disappears
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        {checking ? null : !user ? (
          // Nobody logged in -> login page
          <Login />
        ) : (
          // Logged in -> the app
          <HabitsProvider uid={user.uid} key={user.uid}>
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
        )}
      </PaperProvider>
    </SafeAreaProvider>
  );
}
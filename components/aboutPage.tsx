//Imports
import { Linking, ScrollView, StyleSheet } from "react-native";
import { Appbar, Divider, List, Text, useTheme } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

// ABOUT PAGE
// What the app is, who made it, and where things come from.
// Change the texts and the links to your own.

const VERSION = Constants.expoConfig?.version ?? "1.0.0"; // read from app.json

type Props = {
  onClose: () => void; // called to close the page
};

export default function AboutPage({ onClose }: Props) {
  const theme = useTheme();

  return (
    // A Modal is a separate window, so it needs its own SafeAreaProvider.
    <SafeAreaProvider>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Action
          icon="close"
          onPress={onClose}
          accessibilityLabel="Close"
        />
        <Appbar.Content title="About" />
      </Appbar.Header>

      <SafeAreaView
        edges={["bottom", "left", "right"]}
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* The app */}
          <Text variant="headlineSmall" style={styles.title}>
            Tamagotchi Habits Tracker
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>
            Version {VERSION}
          </Text>

          <Text variant="bodyMedium" style={styles.paragraph}>
            A habit tracker with a virtual pet. When you do your habits, you get
            apples, and you use them to feed your pet.
          </Text>

          <Divider style={styles.divider} />

          {/* Who made it */}
          <List.Section>
            <List.Subheader>Made by</List.Subheader>
            <List.Item
              title="Stéphane Thiébaud"
              description="Mobile Programming project"
              left={(props) => <List.Icon {...props} icon="account" />}
            />
            <List.Item
              title="Source code"
              description="GitHub"
              left={(props) => <List.Icon {...props} icon="github" />}
              onPress={() =>
                Linking.openURL(
                  "https://github.com/Stephoulefifou/TamagotchiHabitsTracker",
                )
              }
            />
          </List.Section>

          <Divider style={styles.divider} />

          {/* Sources: where things come from */}
          <List.Section>
            <List.Subheader>Sources</List.Subheader>
            <List.Item
              title="Pet drawings and animations"
              description="Drawn by me in Krita"
              left={(props) => <List.Icon {...props} icon="draw" />}
            />
            <List.Item
              title="Icons"
              description="Material Design Icons (via React Native Paper)"
              left={(props) => <List.Icon {...props} icon="emoticon-outline" />}
              onPress={() =>
                Linking.openURL("https://pictogrammers.com/library/mdi/")
              }
            />
            <List.Item
              title="Yeti icons"
              description="Created by Magnific - Flaticon"
              left={(props) => <List.Icon {...props} icon="link-variant" />}
              onPress={() =>
                Linking.openURL("https://www.flaticon.com/free-icons/yeti")
              }
            />
            <List.Item
              title="Paper icons"
              description="Created by Anditii Creative - Flaticon"
              left={(props) => <List.Icon {...props} icon="link-variant" />}
              onPress={() =>
                Linking.openURL("https://www.flaticon.com/free-icons/paper")
              }
            />
            <List.Item
              title="Built with"
              description="React Native, Expo, React Native Paper, Reanimated"
              left={(props) => <List.Icon {...props} icon="react" />}
            />
          </List.Section>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// STYLES

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  title: {
    fontWeight: "bold",
  },
  paragraph: {
    marginTop: 12,
  },
  divider: {
    marginVertical: 8,
  },
});

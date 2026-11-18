//Imports
import { useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { IconButton, Menu, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AboutPage from "./aboutPage";

// BURGER MENU
// A button in the top left of every screen. It opens a small menu.
// To add a page later: add a Menu.Item, and a Modal like the About one.

export default function BurgerMenu() {
  const theme = useTheme();
  const insets = useSafeAreaInsets(); // space taken by the status bar

  // Is the small menu open?
  const [menuOpen, setMenuOpen] = useState(false);
  // Is the About page open?
  const [aboutOpen, setAboutOpen] = useState(false);

  // Menu item -> close the menu, then open the page
  function openAbout() {
    setMenuOpen(false);
    setAboutOpen(true);
  }

  return (
    <>
      <View style={[styles.button, { top: insets.top }]}>
        <Menu
          visible={menuOpen}
          onDismiss={() => setMenuOpen(false)} // tap outside -> close
          anchor={
            <IconButton
              icon="menu"
              mode="contained-tonal"
              onPress={() => setMenuOpen(true)}
              accessibilityLabel="Open menu"
            />
          }
        >
          <Menu.Item leadingIcon="information-outline" title="About" onPress={openAbout} />
        </Menu>
      </View>

      {/* About page (slides up over everything) */}
      <Modal
        visible={aboutOpen}
        animationType="slide"
        onRequestClose={() => setAboutOpen(false)} // Android back button
      >
        <AboutPage onClose={() => setAboutOpen(false)} />
      </Modal>
    </>
  );
}

// STYLES

const styles = StyleSheet.create({
  button: {
    position: "absolute", // floats above the screens
    left: 8,
    zIndex: 10,
  },
});
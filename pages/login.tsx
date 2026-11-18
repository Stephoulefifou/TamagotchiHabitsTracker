//Imports
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput, useTheme } from "react-native-paper";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";


// LOGIN PAGE
// Shown when nobody is logged in. One page for both "Log in" and "Sign up".
// When it works, Firebase tells App.tsx (onAuthStateChanged), and the app opens by itself.

// Turns Firebase error codes into readable messages
function errorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "This email doesn't look right.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Wrong email or password.";
    case "auth/email-already-in-use":
      return "There is already an account with this email.";
    case "auth/weak-password":
      return "The password needs at least 6 characters.";
    case "auth/network-request-failed":
      return "No internet connection.";
    default:
      return "Something went wrong. Try again.";
  }
}

export default function Login() {
  const theme = useTheme();

  // What the user types
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // true = "Sign up" page, false = "Log in" page
  const [signingUp, setSigningUp] = useState(false);
  // Waiting for Firebase (the button shows a spinner)
  const [busy, setBusy] = useState(false);
  // The error to show, or "" when there is none
  const [error, setError] = useState("");

  // Log in or sign up, depending on the page
  async function submit() {
    setError("");
    setBusy(true);
    try {
      if (signingUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      // Nothing else to do here: App.tsx sees the new user and opens the app.
    } catch (e) {
        console.log("Firebase error:", e); // shows the real error in the terminal
      setError(errorMessage((e as { code?: string }).code ?? ""));
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined} // iOS: the keyboard doesn't hide the fields
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        {/* Title */}
        <Text variant="headlineMedium" style={styles.title}>
          Tamagotchi Habits Tracker
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.secondary }]}>
          {signingUp ? "Create your account" : "Welcome back !"}
        </Text>

        {/* Fields */}
        <TextInput
          mode="outlined"
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <TextInput
          mode="outlined"
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry // hides the password
          style={styles.field}
        />

        {/* Error */}
        <HelperText type="error" visible={error !== ""}>
          {error}
        </HelperText>

        {/* Main button */}
        <Button
          mode="contained"
          onPress={submit}
          loading={busy}
          disabled={busy || email === "" || password === ""}
        >
          {signingUp ? "Sign up" : "Log in"}
        </Button>

        {/* Switch between "Log in" and "Sign up" */}
        <Button
          style={styles.switch}
          onPress={() => {
            setSigningUp(!signingUp);
            setError("");
          }}
        >
          {signingUp ? "I already have an account" : "No account yet? Sign up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

// STYLES

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 4,
    marginBottom: 32,
  },
  field: {
    marginTop: 12,
  },
  switch: {
    marginTop: 12,
  },
});
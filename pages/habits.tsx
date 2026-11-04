//Imports
import { useState } from "react";
import { Alert, View, FlatList, Modal } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { useHabits, type Habit } from "./flatlist/HabitsContext";
import HabitItem from "../components/habitItem";
import HabitForm from "../components/habitForm";

// HABITS PAGE
// Shows the list, and opens the form to add, edit or delete a habit.

export default function Habits() {
  const { habits, resetAll } = useHabits();
  const theme = useTheme();

  // Is the form open?
  const [formOpen, setFormOpen] = useState(false);
  // The habit being edited, or null when adding a new one
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // "Add" button -> empty form
  function openAdd() {
    setEditingHabit(null);
    setFormOpen(true);
  }

  // Tap on a habit -> form filled with that habit
  function openEdit(habit: Habit) {
    setEditingHabit(habit);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
  }

  // TESTING: clear everything, after a confirmation
  function confirmReset() {
    Alert.alert(
      "Reset everything?",
      "All habits and completions will be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: () => resetAll(false),
        },
        { text: "Reset to examples", onPress: () => resetAll(true) },
      ],
    );
  }

  return (
    <View
      style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}
    >
      {/* Header */}
      <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
        Set up your habits !
      </Text>
      <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
        Tap a habit to edit or delete it.
      </Text>

      <Button mode="contained" icon="plus" onPress={openAdd}>
        Add a habit
      </Button>

      {/* List */}
      <FlatList
        style={{ marginTop: 16 }}
        contentContainerStyle={{ paddingBottom: 100 }} // empty space at the end so the last habit can scroll above the navbar
        data={habits}
        keyExtractor={(habit) => String(habit.id)}
        renderItem={({ item }) => (
          <HabitItem habit={item} onPress={() => openEdit(item)} />
        )}
        ListEmptyComponent={
          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.secondary,
              textAlign: "center",
              marginTop: 32,
            }}
          >
            No habits yet. Add your first one !
          </Text>
        }
        // TESTING: reset button at the end of the list (remove before submitting)
        ListFooterComponent={
          <Button
            mode="outlined"
            icon="delete-sweep"
            textColor={theme.colors.error}
            style={{ marginTop: 24, borderColor: theme.colors.error }}
            onPress={confirmReset}
          >
            Reset everything (testing)
          </Button>
        }
      />

      {/* Form (slides up over the list) */}
      <Modal
        visible={formOpen}
        animationType="slide"
        onRequestClose={closeForm} // Android back button
      >
        <HabitForm
          key={editingHabit?.id ?? "new"} // fresh form for each habit
          habit={editingHabit ?? undefined}
          onClose={closeForm}
        />
      </Modal>
    </View>
  );
}

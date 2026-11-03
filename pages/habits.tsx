//Imports
import { useState } from "react";
import { View, Text, Button, FlatList, Modal } from "react-native";
import { colors } from "../components/colors";
import { useHabits, type Habit } from "./flatlist/HabitsContext";
import HabitItem from "../components/habitItem";
import HabitForm from "../components/habitForm";

// HABITS PAGE
// Shows the list, and opens the form to add, edit or delete a habit.

export default function Habits() {
  const { habits } = useHabits();

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

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: colors.background }}>
      {/* Header */}
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: "bold" }}>
        Set up your habits !
      </Text>
      <Text style={{ color: colors.text, marginBottom: 16 }}>
        Tap a habit to edit or delete it.
      </Text>

      <Button title="Add a habit" color={colors.primary} onPress={openAdd} />

      {/* List */}
      <FlatList
        style={{ marginTop: 16 }}
        data={habits}
        keyExtractor={(habit) => String(habit.id)}
        renderItem={({ item }) => <HabitItem habit={item} onPress={() => openEdit(item)} />}
        ListEmptyComponent={
          <Text style={{ color: colors.secondary, textAlign: "center", marginTop: 32 }}>
            No habits yet. Add your first one !
          </Text>
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

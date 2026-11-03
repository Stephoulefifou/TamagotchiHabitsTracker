//Imports
import { Pressable, Text, View, StyleSheet } from "react-native";
import { colors } from "./colors";
import { daysUntilNext, type Habit, type Recurrence } from "../pages/flatlist/HabitsContext";

// RECURRENCE TEXT
// Turns a recurrence into readable text, e.g. "Every 2 weeks on Mon, Thu"

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const NTH_NAMES: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", [-1]: "Last" };

export function describeRecurrence(r: Recurrence): string {
  switch (r.type) {
    case "daily":
      return r.every === 1 ? "Every day" : `Every ${r.every} days`;

    case "weekly": {
      // Monday first, Sunday last
      const days = [...r.days]
        .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
        .map((d) => DAY_NAMES[d])
        .join(", ");
      return r.every === 1 ? `Every ${days}` : `Every ${r.every} weeks on ${days}`;
    }

    case "monthly": {
      const day = r.day === "last" ? "last day" : `day ${r.day}`;
      return r.every === 1 ? `Monthly, ${day}` : `Every ${r.every} months, ${day}`;
    }

    case "monthlyNth": {
      const which = `${NTH_NAMES[r.nth]} ${DAY_NAMES[r.weekday]}`;
      return r.every === 1 ? `${which} of the month` : `${which}, every ${r.every} months`;
    }

    case "yearly":
      return `Every year on ${r.day}/${r.month}`;
  }
}

// DUE IN TEXT
// Turns a number of days into readable text, e.g. "In 3 days", "In 2 weeks"

function formatDueIn(days: number | null): string {
  if (days === null) return "Not scheduled";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days < 14) return `In ${days} days`;
  if (days < 60) return `In ${Math.round(days / 7)} weeks`;
  return `In ${Math.round(days / 30)} months`;
}

// HABIT ITEM
// How one habit looks in the list. Tapping it calls onPress.

type Props = {
  habit: Habit;
  onPress: () => void;
};

export default function HabitItem({ habit, onPress }: Props) {
  const dueIn = daysUntilNext(habit.recurrence);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.6 }]}
    >
      {/* Name on the left, "due in" on the right */}
      <View style={styles.header}>
        <Text style={styles.name}>{habit.name}</Text>
        <Text style={[styles.dueIn, dueIn === 0 && styles.dueToday]}>{formatDueIn(dueIn)}</Text>
      </View>

      {habit.description !== "" && <Text style={styles.text}>{habit.description}</Text>}

      <Text style={styles.text}>
        {describeRecurrence(habit.recurrence)}
        {habit.timesPerDay > 1 ? ` · ${habit.timesPerDay}× a day` : ""}
      </Text>

      <Text style={styles.text}>Strength: {habit.strength}/10</Text>
    </Pressable>
  );
}

// STYLES

const styles = StyleSheet.create({
  card: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "bold",
    flexShrink: 1, // long names wrap instead of pushing the "due in" text away
  },
  dueIn: {
    color: colors.secondary,
    fontSize: 13,
    marginLeft: 8,
  },
  dueToday: {
    color: colors.primary,
    fontWeight: "bold",
  },
  text: {
    color: colors.text,
  },
});
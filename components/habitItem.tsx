//Imports
import { View, StyleSheet } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
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
  const theme = useTheme();
  const dueIn = daysUntilNext(habit.recurrence);

  return (
    <Card mode="outlined" onPress={onPress} style={[styles.card, { borderColor: theme.colors.secondary }]}>
      <Card.Content>
        {/* Name on the left, "due in" on the right */}
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.name}>{habit.name}</Text>
          <Text
            variant="labelMedium"
            style={[
              styles.dueIn,
              { color: dueIn === 0 ? theme.colors.primary : theme.colors.secondary },
              dueIn === 0 && styles.dueToday,
            ]}
          >
            {formatDueIn(dueIn)}
          </Text>
        </View>

        {habit.description !== "" && <Text variant="bodyMedium">{habit.description}</Text>}

        <Text variant="bodyMedium">
          {describeRecurrence(habit.recurrence)}
          {habit.timesPerDay > 1 ? ` · ${habit.timesPerDay}× a day` : ""}
        </Text>

        <Text variant="bodyMedium">Strength: {habit.strength}/10</Text>
      </Card.Content>
    </Card>
  );
}

// STYLES

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontWeight: "bold",
    flexShrink: 1, // long names wrap instead of pushing the "due in" text away
  },
  dueIn: {
    marginLeft: 8,
  },
  dueToday: {
    fontWeight: "bold",
  },
});
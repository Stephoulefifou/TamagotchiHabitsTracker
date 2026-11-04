//Imports
import { View, StyleSheet, Alert } from "react-native";
import { Card, IconButton, Text, useTheme } from "react-native-paper";
import {
  daysUntilNext,
  isDueOn,
  useHabits,
  type Habit,
  type Recurrence,
} from "../pages/flatlist/HabitsContext";

// RECURRENCE TEXT
// Turns a recurrence into readable text, e.g. "Every 2 weeks on Mon, Thu"

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const NTH_NAMES: Record<number, string> = {
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "4th",
  [-1]: "Last",
};

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
      return r.every === 1
        ? `Every ${days}`
        : `Every ${r.every} weeks on ${days}`;
    }

    case "monthly": {
      const day = r.day === "last" ? "last day" : `day ${r.day}`;
      return r.every === 1
        ? `Monthly, ${day}`
        : `Every ${r.every} months, ${day}`;
    }

    case "monthlyNth": {
      const which = `${NTH_NAMES[r.nth]} ${DAY_NAMES[r.weekday]}`;
      return r.every === 1
        ? `${which} of the month`
        : `${which}, every ${r.every} months`;
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

// Days until the next time AFTER today (used when today is already done)
function daysUntilNextAfterToday(r: Recurrence): number | null {
  const now = new Date();
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  const days = daysUntilNext(r, tomorrow);
  return days === null ? null : days + 1;
}

// HABIT ITEM
// How one habit looks in the list. Tapping it calls onPress (edit).
// When the habit is due today, a check button on the right marks it as done.

type Props = {
  habit: Habit;
  onPress: () => void;
};

export default function HabitItem({ habit, onPress }: Props) {
  const theme = useTheme();
  const { timesDone, markDone, resetDone } = useHabits();

  // Today's state
  const dueToday = isDueOn(habit.recurrence);
  const done = timesDone(habit.id); // how many times done today
  const doneToday = dueToday && done >= habit.timesPerDay;

  // Already done today -> show when the NEXT one is
  const dueIn = doneToday
    ? daysUntilNextAfterToday(habit.recurrence)
    : daysUntilNext(habit.recurrence);

  // Check button: +1 until fully done, then tapping again cancels today
  function check() {
    if (doneToday) {
      // Already done -> ask to undo
      Alert.alert(
        "Undo this habit?",
        "It will be marked as not done for today.",
        [
          { text: "Keep it done", style: "cancel" },
          {
            text: "Undo",
            style: "destructive",
            onPress: () => resetDone(habit.id),
          },
        ],
      );
    } else {
      // Not done yet -> ask to confirm
      Alert.alert(
        "Did you complete this habit?",
        "Your tamagotchi will be proud of you !",
        [
          { text: "No", style: "cancel" },
          { text: "Yes", onPress: () => markDone(habit.id) },
        ],
      );
    }
  }

  return (
    <Card
      mode="outlined"
      onPress={onPress}
      style={[
        styles.card,
        { borderColor: theme.colors.secondary },
        doneToday && styles.cardDone,
      ]}
    >
      <Card.Content style={styles.content}>
        {/* Left: the habit's info */}
        <View style={styles.info}>
          {/* Name on the left, "due in" on the right */}
          <View style={styles.header}>
            <Text
              variant="titleMedium"
              style={[styles.name, doneToday && styles.nameDone]}
            >
              {habit.name}
            </Text>
            <Text
              variant="labelMedium"
              style={[
                styles.dueIn,
                {
                  color:
                    dueIn === 0 ? theme.colors.primary : theme.colors.secondary,
                },
                dueIn === 0 && styles.dueToday,
              ]}
            >
              {formatDueIn(dueIn)}
            </Text>
          </View>

          {habit.description !== "" && (
            <Text variant="bodyMedium">{habit.description}</Text>
          )}

          <Text variant="bodyMedium">
            {describeRecurrence(habit.recurrence)}
            {habit.timesPerDay > 1 ? ` · ${habit.timesPerDay}× a day` : ""}
          </Text>

          <Text variant="bodyMedium">Strength: {habit.strength}/10</Text>
        </View>

        {/* Right: check button, only on days the habit is due */}
        {dueToday && (
          <View style={styles.check}>
            <IconButton
              icon={
                doneToday ? "check-circle" : "checkbox-blank-circle-outline"
              }
              iconColor={theme.colors.primary}
              size={32}
              onPress={check}
              accessibilityLabel={
                doneToday ? "Cancel today's completion" : "Mark as done"
              }
            />
            {/* Several times a day: show progress, e.g. 1/3 */}
            {habit.timesPerDay > 1 && (
              <Text variant="labelMedium">
                {done}/{habit.timesPerDay}
              </Text>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

// STYLES

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
  cardDone: {
    opacity: 0.6, // done habits fade a bit
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  info: {
    flex: 1,
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
  nameDone: {
    textDecorationLine: "line-through",
  },
  dueIn: {
    marginLeft: 8,
  },
  dueToday: {
    fontWeight: "bold",
  },
  check: {
    alignItems: "center",
    marginLeft: 4,
  },
});

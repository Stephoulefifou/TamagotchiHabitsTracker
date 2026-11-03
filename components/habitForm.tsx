//Imports
import { useState } from "react";
import { Alert, Button, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { colors } from "./colors";
import { describeRecurrence } from "./habitItem";
import {
  useHabits,
  todayString,
  type Habit,
  type NewHabit,
  type Recurrence,
  type Weekday,
} from "../pages/flatlist/HabitsContext";

// OPTIONS
// What the user sees. These are friendlier than the Recurrence types:
// "Daily" and "Every few days" are both saved as type 'daily',
// and "Monthly" is saved as 'monthlyNth' (by weekday) or 'monthly' (by date).

type Frequency = "daily" | "everyFewDays" | "weekly" | "monthly" | "yearly";
type MonthlyMode = "weekday" | "date";
type Nth = 1 | 2 | 3 | 4 | -1;

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "everyFewDays", label: "Every few days" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

// Monday first
const WEEKDAYS: { value: Weekday; label: string }[] = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

const NTH_OPTIONS: { value: Nth; label: string }[] = [
  { value: 1, label: "1st" },
  { value: 2, label: "2nd" },
  { value: 3, label: "3rd" },
  { value: 4, label: "4th" },
  { value: -1, label: "Last" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STRENGTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// HELPERS

// 'YYYY-MM-DD' -> Date
function parseDate(ymd: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Days in a month (1-12). Uses a leap year so February can have the 29th.
function daysInMonth(month: number): number {
  return new Date(2024, month, 0).getDate();
}

// Numbers from 1 to n: [1, 2, ..., n]
function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}

// Which "Repeats" option matches a saved habit
function getFrequency(r?: Recurrence): Frequency {
  if (!r) return "daily";
  if (r.type === "daily") return r.every === 1 ? "daily" : "everyFewDays";
  if (r.type === "monthly" || r.type === "monthlyNth") return "monthly";
  return r.type; // 'weekly' or 'yearly'
}

// SMALL COMPONENTS

// A tappable "pill" button, used for every choice in the form.
function Chip({ label, selected, onPress, small }: { label: string; selected: boolean; onPress: () => void; small?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, small && styles.chipSmall, selected && styles.chipSelected]}>
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

// A title above each part of the form.
function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

// [ − ]  Every 2 weeks  [ + ]
function Stepper({ value, onChange, format, min = 1, max = 99 }: {
  value: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
  min?: number;
  max?: number;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={[styles.stepButton, value <= min && { opacity: 0.3 }]}
      >
        <Text style={styles.stepButtonText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{format(value)}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={[styles.stepButton, value >= max && { opacity: 0.3 }]}
      >
        <Text style={styles.stepButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

// FORM
// One form for both adding and editing.
// No `habit` -> empty form, Save adds. With `habit` -> pre-filled, Save updates, Delete appears.

type Props = {
  habit?: Habit;       // the habit to edit (missing = new habit)
  onClose: () => void; // called to close the form
};

export default function HabitForm({ habit, onClose }: Props) {
  const { addHabit, updateHabit, removeHabit } = useHabits();
  const isEditing = habit !== undefined;
  const r = habit?.recurrence; // the saved recurrence, when editing
  const today = new Date();

  // Basic fields
  const [name, setName] = useState(habit?.name ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [strength, setStrength] = useState(habit?.strength ?? 5);
  const [timesPerDay, setTimesPerDay] = useState(habit?.timesPerDay ?? 1);

  // Repeats
  const [frequency, setFrequency] = useState<Frequency>(getFrequency(r));

  // Every few days
  const [dayInterval, setDayInterval] = useState(r?.type === "daily" && r.every > 1 ? r.every : 2);

  // Weekly (new habit: today's weekday is pre-selected)
  const [weekDays, setWeekDays] = useState<Weekday[]>(r?.type === "weekly" ? r.days : [today.getDay() as Weekday]);
  const [weekInterval, setWeekInterval] = useState(r?.type === "weekly" ? r.every : 1);

  // Monthly (by weekday is the default)
  const [monthlyMode, setMonthlyMode] = useState<MonthlyMode>(r?.type === "monthly" ? "date" : "weekday");
  const [monthInterval, setMonthInterval] = useState(r?.type === "monthly" || r?.type === "monthlyNth" ? r.every : 1);
  const [nth, setNth] = useState<Nth>(() => {
    if (r?.type === "monthlyNth") return r.nth;
    const week = Math.ceil(today.getDate() / 7); // which week of the month today is
    return week > 4 ? -1 : (week as Nth);
  });
  const [nthWeekday, setNthWeekday] = useState<Weekday>(r?.type === "monthlyNth" ? r.weekday : (today.getDay() as Weekday));
  const [monthDay, setMonthDay] = useState<number | "last">(r?.type === "monthly" ? r.day : today.getDate());

  // Yearly (new habit: today's date)
  const [yearMonth, setYearMonth] = useState(r?.type === "yearly" ? r.month : today.getMonth() + 1);
  const [yearDay, setYearDay] = useState(r?.type === "yearly" ? r.day : today.getDate());

  // Start date (calendar)
  const [startDate, setStartDate] = useState<Date>(r ? parseDate(r.startDate) : today);
  const [showCalendar, setShowCalendar] = useState(false);

  // "Times per day" only makes sense for daily things
  const isDailyLike = frequency === "daily" || frequency === "everyFewDays";

  // Weekly: tap a day to add it, tap again to remove it (at least one stays selected)
  function toggleWeekDay(day: Weekday) {
    setWeekDays((previous) => {
      if (!previous.includes(day)) return [...previous, day];
      if (previous.length === 1) return previous;
      return previous.filter((d) => d !== day);
    });
  }

  // Yearly: changing month keeps the day valid (e.g. 31 -> 30 for April)
  function changeYearMonth(month: number) {
    setYearMonth(month);
    setYearDay((day) => Math.min(day, daysInMonth(month)));
  }

  // Calendar: Android shows a popup that closes itself, iOS shows it inline
  function onPickDate(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === "android") setShowCalendar(false);
    if (event.type === "set" && date) setStartDate(date);
  }

  // Builds the Recurrence that gets saved, from what the user picked
  function buildRecurrence(): Recurrence {
    const start = todayString(startDate);

    switch (frequency) {
      case "daily":
        return { type: "daily", every: 1, startDate: start };

      case "everyFewDays":
        return { type: "daily", every: dayInterval, startDate: start };

      case "weekly":
        return { type: "weekly", every: weekInterval, days: weekDays, startDate: start };

      case "monthly":
        return monthlyMode === "weekday"
          ? { type: "monthlyNth", every: monthInterval, nth, weekday: nthWeekday, startDate: start }
          : { type: "monthly", every: monthInterval, day: monthDay, startDate: start };

      case "yearly":
        return { type: "yearly", month: yearMonth, day: yearDay, startDate: start };
    }
  }

  // Readable summary shown under the repeat options, e.g. "Every Mon, Thu"
  const summary =
    describeRecurrence(buildRecurrence()) +
    (isDailyLike && timesPerDay > 1 ? ` · ${timesPerDay} times a day` : "");

  // Save: checks the form, then adds or updates
  function save() {
    if (name.trim() === "") {
      Alert.alert("Missing name", "Give your habit a name.");
      return;
    }

    const data: NewHabit = {
      name: name.trim(),
      description: description.trim(),
      recurrence: buildRecurrence(),
      timesPerDay: isDailyLike ? timesPerDay : 1,
      strength,
    };

    if (habit) updateHabit(habit.id, data);
    else addHabit(data);

    onClose();
  }

  // Delete (only when editing), with a confirmation
  function confirmDelete() {
    if (!habit) return;
    Alert.alert("Delete this habit?", `"${habit.name}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          removeHabit(habit.id);
          onClose();
        },
      },
    ]);
  }

  return (
    // A Modal is a separate window, so it needs its own SafeAreaProvider.
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.title}>{isEditing ? "Edit habit" : "New habit"}</Text>
          <Button title="Cancel" color={colors.secondary} onPress={onClose} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Name & description */}
          <Label>Name</Label>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Water the plants"
            placeholderTextColor={colors.secondary}
          />

          <Label>Description</Label>
          <TextInput
            style={[styles.input, { minHeight: 70 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional"
            placeholderTextColor={colors.secondary}
            multiline
          />

          {/* Repeats */}
          <Label>Repeats</Label>
          <View style={styles.row}>
            {FREQUENCIES.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={frequency === option.value}
                onPress={() => setFrequency(option.value)}
              />
            ))}
          </View>

          {/* Every few days: how many days between */}
          {frequency === "everyFewDays" && (
            <>
              <Label>How often?</Label>
              <Stepper value={dayInterval} onChange={setDayInterval} min={2} format={(n) => `Every ${n} days`} />
            </>
          )}

          {/* Daily things: times per day */}
          {isDailyLike && (
            <>
              <Label>Times per day</Label>
              <Stepper
                value={timesPerDay}
                onChange={setTimesPerDay}
                max={20}
                format={(n) => (n === 1 ? "Once" : `${n} times`)}
              />
            </>
          )}

          {/* Weekly: which days + every how many weeks */}
          {frequency === "weekly" && (
            <>
              <Label>On which days?</Label>
              <View style={styles.row}>
                {WEEKDAYS.map((day) => (
                  <Chip
                    key={day.value}
                    label={day.label}
                    selected={weekDays.includes(day.value)}
                    onPress={() => toggleWeekDay(day.value)}
                  />
                ))}
              </View>

              <Label>How often?</Label>
              <Stepper
                value={weekInterval}
                onChange={setWeekInterval}
                format={(n) => (n === 1 ? "Every week" : `Every ${n} weeks`)}
              />
            </>
          )}

          {/* Monthly: by weekday (default) or by date */}
          {frequency === "monthly" && (
            <>
              <View style={styles.segmented}>
                <Pressable
                  onPress={() => setMonthlyMode("weekday")}
                  style={[styles.segment, monthlyMode === "weekday" && styles.segmentSelected]}
                >
                  <Text style={styles.chipText}>By weekday</Text>
                  <Text style={styles.hint}>e.g. the 1st Monday</Text>
                </Pressable>
                <Pressable
                  onPress={() => setMonthlyMode("date")}
                  style={[styles.segment, monthlyMode === "date" && styles.segmentSelected]}
                >
                  <Text style={styles.chipText}>By date</Text>
                  <Text style={styles.hint}>e.g. the 15th</Text>
                </Pressable>
              </View>

              {monthlyMode === "weekday" ? (
                <>
                  <Label>On the</Label>
                  <View style={styles.row}>
                    {NTH_OPTIONS.map((option) => (
                      <Chip
                        key={option.value}
                        label={option.label}
                        selected={nth === option.value}
                        onPress={() => setNth(option.value)}
                      />
                    ))}
                  </View>
                  <View style={[styles.row, { marginTop: 8 }]}>
                    {WEEKDAYS.map((day) => (
                      <Chip
                        key={day.value}
                        label={day.label}
                        selected={nthWeekday === day.value}
                        onPress={() => setNthWeekday(day.value)}
                      />
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <Label>On day</Label>
                  <View style={styles.row}>
                    {range(31).map((day) => (
                      <Chip
                        key={day}
                        small
                        label={String(day)}
                        selected={monthDay === day}
                        onPress={() => setMonthDay(day)}
                      />
                    ))}
                    <Chip label="Last day" selected={monthDay === "last"} onPress={() => setMonthDay("last")} />
                  </View>
                </>
              )}

              <Label>How often?</Label>
              <Stepper
                value={monthInterval}
                onChange={setMonthInterval}
                max={12}
                format={(n) => (n === 1 ? "Every month" : `Every ${n} months`)}
              />
            </>
          )}

          {/* Yearly: month + day */}
          {frequency === "yearly" && (
            <>
              <Label>Month</Label>
              <View style={styles.row}>
                {MONTHS.map((label, index) => (
                  <Chip
                    key={label}
                    label={label}
                    selected={yearMonth === index + 1}
                    onPress={() => changeYearMonth(index + 1)}
                  />
                ))}
              </View>

              <Label>Day</Label>
              <View style={styles.row}>
                {range(daysInMonth(yearMonth)).map((day) => (
                  <Chip
                    key={day}
                    small
                    label={String(day)}
                    selected={yearDay === day}
                    onPress={() => setYearDay(day)}
                  />
                ))}
              </View>
            </>
          )}

          {/* Start date */}
          <Label>Starts on</Label>
          <Pressable style={styles.input} onPress={() => setShowCalendar(!showCalendar)}>
            <Text style={styles.text}>
              {startDate.toLocaleDateString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </Pressable>
          {showCalendar && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              themeVariant="dark"
              accentColor={colors.primary}
              onChange={onPickDate}
            />
          )}

          {/* Summary: what the user picked, in plain words */}
          <View style={styles.summary}>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>

          {/* Strength */}
          <Label>Strength (1 = easy, 10 = hard)</Label>
          <View style={styles.row}>
            {STRENGTHS.map((value) => (
              <Chip
                key={value}
                small
                label={String(value)}
                selected={strength === value}
                onPress={() => setStrength(value)}
              />
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button title="Save" color={colors.primary} onPress={save} />
            {isEditing && <Button title="Delete habit" color="#e5484d" onPress={confirmDelete} />}
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// STYLES

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  label: {
    color: colors.text,
    fontWeight: "bold",
    marginTop: 18,
    marginBottom: 8,
  },
  text: {
    color: colors.text,
  },
  hint: {
    color: colors.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  input: {
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 8,
    padding: 10,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  // Chips
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
  },
  chipSmall: {
    width: 40,
    paddingHorizontal: 0,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.text,
  },

  // Stepper
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 12,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonText: {
    color: colors.text,
    fontSize: 20,
  },
  stepValue: {
    color: colors.text,
    fontSize: 16,
    minWidth: 120,
    textAlign: "center",
  },

  // Monthly: by weekday / by date
  segmented: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  segment: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
  },
  segmentSelected: {
    backgroundColor: colors.primary,
  },

  // Summary
  summary: {
    marginTop: 18,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: colors.nav_background,
  },
  summaryText: {
    color: colors.text,
    fontWeight: "bold",
  },

  actions: {
    marginTop: 32,
    gap: 12,
  },
});
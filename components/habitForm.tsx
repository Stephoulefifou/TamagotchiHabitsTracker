//Imports
import { useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  Chip as PaperChip,
  Dialog,
  HelperText,
  IconButton,
  Portal,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import DateTimePicker, { type DateTimePickerChangeEvent } from "@react-native-community/datetimepicker";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
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
// Small chips (numbers) are fixed-width and skip the check mark so they line up in a grid.
function Chip({ label, selected, onPress, small }: { label: string; selected: boolean; onPress: () => void; small?: boolean }) {
  return (
    <PaperChip
      mode="outlined"
      selected={selected}
      showSelectedOverlay
      showSelectedCheck={!small}
      compact={small}
      onPress={onPress}
      style={small && styles.chipSmall}
      textStyle={small && styles.chipSmallText}
    >
      {label}
    </PaperChip>
  );
}

// A title above each part of the form.
function Label({ children }: { children: string }) {
  return (
    <Text variant="titleSmall" style={styles.label}>
      {children}
    </Text>
  );
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
      <IconButton
        icon="minus"
        mode="outlined"
        size={18}
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      />
      <Text variant="bodyLarge" style={styles.stepValue}>
        {format(value)}
      </Text>
      <IconButton
        icon="plus"
        mode="outlined"
        size={18}
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      />
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
  const theme = useTheme();
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

  // Save was pressed with an empty name -> the field shows an error
  const [nameError, setNameError] = useState(false);
  // Delete confirmation dialog
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
  function onPickDate(_event: DateTimePickerChangeEvent, date: Date) {
    if (Platform.OS === "android") setShowCalendar(false);
    setStartDate(date);
  }

  // Android popup closed with "Cancel": just hide it
  function onCancelDate() {
    setShowCalendar(false);
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
      setNameError(true);
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

  // Delete (only when editing), after the confirmation dialog
  function deleteHabit() {
    if (!habit) return;
    setConfirmingDelete(false);
    removeHabit(habit.id);
    onClose();
  }

  return (
    // A Modal is a separate window, so it needs its own SafeAreaProvider,
    // and its own Portal.Host so the delete dialog shows above the form.
    <SafeAreaProvider>
      <Portal.Host>
        {/* Top bar (handles the top safe area itself) */}
        <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
          <Appbar.Action icon="close" onPress={onClose} accessibilityLabel="Cancel" />
          <Appbar.Content title={isEditing ? "Edit habit" : "New habit"} titleStyle={styles.title} />
          <Appbar.Action icon="check" onPress={save} accessibilityLabel="Save" />
        </Appbar.Header>

        <SafeAreaView edges={["bottom", "left", "right"]} style={[styles.screen, { backgroundColor: theme.colors.background }]}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {/* Name & description */}
            <TextInput
              mode="outlined"
              label="Name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (text.trim() !== "") setNameError(false);
              }}
              placeholder="e.g. Water the plants"
              error={nameError}
            />
            <HelperText type="error" visible={nameError}>
              Give your habit a name.
            </HelperText>

            <TextInput
              mode="outlined"
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Optional"
              multiline
              style={{ minHeight: 70 }}
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
                <SegmentedButtons
                  style={styles.segmented}
                  value={monthlyMode}
                  onValueChange={(value) => setMonthlyMode(value as MonthlyMode)}
                  buttons={[
                    { value: "weekday", label: "By weekday", icon: "calendar-week" },
                    { value: "date", label: "By date", icon: "calendar-month" },
                  ]}
                />
                <HelperText type="info">
                  {monthlyMode === "weekday" ? "e.g. the 1st Monday" : "e.g. the 15th"}
                </HelperText>

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
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => setShowCalendar(!showCalendar)}
              style={styles.dateButton}
              textColor={theme.colors.onSurface}
            >
              {startDate.toLocaleDateString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Button>
            {showCalendar && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                themeVariant="dark"
                accentColor={theme.colors.primary}
                onValueChange={onPickDate}
                onDismiss={onCancelDate}
              />
            )}

            {/* Summary: what the user picked, in plain words */}
            <Surface elevation={1} style={[styles.summary, { borderLeftColor: theme.colors.primary }]}>
              <Text variant="titleSmall">{summary}</Text>
            </Surface>

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
              <Button mode="contained" icon="content-save" onPress={save}>
                Save
              </Button>
              {isEditing && (
                <Button
                  mode="outlined"
                  icon="delete"
                  textColor={theme.colors.error}
                  style={{ borderColor: theme.colors.error }}
                  onPress={() => setConfirmingDelete(true)}
                >
                  Delete habit
                </Button>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>

        {/* Delete confirmation */}
        <Portal>
          <Dialog visible={confirmingDelete} onDismiss={() => setConfirmingDelete(false)}>
            <Dialog.Icon icon="alert" />
            <Dialog.Title style={{ textAlign: "center" }}>Delete this habit?</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">{`"${habit?.name}" will be removed.`}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setConfirmingDelete(false)}>Cancel</Button>
              <Button textColor={theme.colors.error} onPress={deleteHabit}>
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </Portal.Host>
    </SafeAreaProvider>
  );
}

// STYLES
// Colors come from the Paper theme; these are only layout tweaks.

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  title: {
    fontWeight: "bold",
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  label: {
    marginTop: 18,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  // Number chips line up in a grid
  chipSmall: {
    width: 44,
    justifyContent: "center",
  },
  chipSmallText: {
    marginHorizontal: 0,
    textAlign: "center",
    flex: 1,
  },

  // Stepper
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  stepValue: {
    minWidth: 120,
    textAlign: "center",
  },

  segmented: {
    marginTop: 18,
  },

  dateButton: {
    alignSelf: "flex-start",
  },

  // Summary
  summary: {
    marginTop: 18,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
  },

  actions: {
    marginTop: 32,
    gap: 12,
  },
});

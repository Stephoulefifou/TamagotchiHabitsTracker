//Imports
import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { isDueOn, useHabits, type Habit } from "./HabitsContext";

// SETTINGS

const CHANNEL_ID = "habits";   // Android groups notifications in "channels"
const DAYS_AHEAD = 14;         // how far in the future we schedule
const MAX_NOTIFICATIONS = 60;  // iOS keeps at most 64 scheduled notifications

// When reminders are sent during the day (in minutes since midnight)
const FIRST_REMINDER = 9 * 60;  // 09:00
const LAST_REMINDER = 21 * 60;  // 21:00

// Show notifications even when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// HELPERS

// Reminder times for a day, spread evenly between 09:00 and 21:00
// 1 time -> 09:00 · 2 times -> 09:00, 21:00 · 3 times -> 09:00, 15:00, 21:00
function reminderMinutes(timesPerDay: number): number[] {
  if (timesPerDay <= 1) return [FIRST_REMINDER];
  const step = (LAST_REMINDER - FIRST_REMINDER) / (timesPerDay - 1);
  return Array.from({ length: timesPerDay }, (_, i) => Math.round(FIRST_REMINDER + i * step));
}

// Asks the user for permission (only shows a popup the first time)
async function askPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

// Android needs a channel before sending anything
async function createChannel() {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Habit reminders",
      // eslint-disable-next-line import/namespace
      importance: Notifications.AndroidImportance.HIGH,
    });
  } catch (error) {
    // If the channel can't be created, Android uses its default one: reminders still work
    console.warn("Could not create the notification channel", error);
  }
}

// SCHEDULING

// Removes all planned reminders, then plans the ones for the next DAYS_AHEAD days
export async function scheduleHabitNotifications(habits: Habit[]) {
  if (!(await askPermission())) return; // the user said no: nothing to do
  await createChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const reminders: { date: Date; habit: Habit; index: number }[] = [];

  // Every day from today, every habit due that day, every time of that day
  for (let day = 0; day < DAYS_AHEAD; day++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day);

    for (const habit of habits) {
      if (!isDueOn(habit.recurrence, date)) continue;

      reminderMinutes(habit.timesPerDay).forEach((minutes, index) => {
        const when = new Date(date);
        when.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
        if (when > now) reminders.push({ date: when, habit, index }); // skip times already passed
      });
    }
  }

  // Soonest first, and stay under the iOS limit
  reminders.sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const { date, habit, index } of reminders.slice(0, MAX_NOTIFICATIONS)) {
    const several = habit.timesPerDay > 1;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: several ? `${habit.name} (${index + 1}/${habit.timesPerDay})` : habit.name,
        body: habit.description || "Your Tamagotchi is counting on you!",
        data: { habitId: habit.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: CHANNEL_ID,
      },
    });
  }
}

// Sends a notification in 5 seconds, to check that everything works
export async function sendTestNotification() {
  if (!(await askPermission())) return;
  await createChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title: "Test notification", body: "Notifications work!" },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: CHANNEL_ID,
    },
  });
}

// COMPONENT
// Put it once inside <HabitsProvider>. It shows nothing:
// it just re-plans the reminders every time the habits change.

export default function HabitNotifications() {
  const { habits } = useHabits();

  useEffect(() => {
    scheduleHabitNotifications(habits);
  }, [habits]);

  return null;
}
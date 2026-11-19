//Imports
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { PLACEHOLDER_HABITS } from "./placeholderHabits"; // TODO: remove before submitting
// Firebase
import { database } from "../../firebaseConfig.js";
import { ref, get, set } from "firebase/database";
import {
  currentFullness,
  MAX_FULLNESS,
  type Fullness,
} from "../../components/fullness";
import type { SlimeColor } from "../../components/animation/frames";
import { CATEGORIES, findItem } from "../../components/shop/shopitems";

// The pet. null = not born yet (the egg is shown)
export type Pet = {
  name: string; // from the Random User API
  color: SlimeColor; // random, at hatching
  bornAt: number; // when it hatched (Date.now())
};

// Day of the week
export type Weekday =
  | 0 // Sunday
  | 1 // Monday
  | 2 // Tuesday
  | 3 // Wednesday
  | 4 // Thursday
  | 5 // Friday
  | 6; // Saturday

// Recurrence rules for habits. Each habit has one of these. But the rules are flexible: you can do a habit every day, or only on certain days of the week, or only on certain days of the month, etc.
export type Recurrence =
  | {
      type: "daily"; //every day
      every: number;
      startDate: string;
    }
  | {
      type: "weekly"; // once a week
      every: number;
      days: Weekday[]; // which days of the week
      startDate: string;
    }
  | {
      type: "monthly"; // once a month
      every: number;
      day: number | "last"; // day of the month (1-31), or 'last' - to avoid issues with months that have fewer than 31 days
      startDate: string;
    }
  | {
      type: "monthlyNth"; // e.g. "the 2nd Tuesday of every month"
      every: number;
      nth: 1 | 2 | 3 | 4 | -1; // 1 = first, 2 = second... -1 = last
      weekday: Weekday;
      startDate: string;
    }
  | {
      type: "yearly"; // once a year
      month: number; // 1 = January ... 12 = December
      day: number; // day of the month (1-31)
      startDate: string;
    };

// One habit (one item in the FlatList).
export type Habit = {
  id: number;
  name: string;
  description: string;
  recurrence: Recurrence; // which days it happens
  timesPerDay: number; // how many times on those days (1 = once, default value)
  strength: number; // difficulty, from 1 (easy) to 10 (hard)
};

// habit before it is saved: everything except the id, created here
export type NewHabit = Omit<Habit, "id">;

// How many times each habit was done, per day.
// e.g. completions[12]['2026-11-04'] = 2 -> habit 12 was done twice on Nov 4
export type Completions = Record<number, Record<string, number>>;

// DATE HELPERS

// Today as 'YYYY-MM-DD' (used as the default start date in the form)
export function todayString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Turns 'YYYY-MM-DD' into a Date (local time, midnight)
function parseDate(ymd: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, month - 1, day); // months start at 0 in JS
}

// Number of whole days from date a to date b
function daysBetween(a: Date, b: Date): number {
  // Using UTC avoids off-by-one errors on daylight saving days.
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000); // ms in one day
}

// How many days the month of this date has (28 to 31)
function daysInMonth(date: Date): number {
  // Day 0 of next month = last day of this month.
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// The Monday of the week that contains this date.
function startOfWeek(date: Date): Date {
  const daysSinceMonday = (date.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - daysSinceMonday,
  );
}

// IS IT DUE?

//Returns true if the recurrence happens on `date` (today by default).

export function isDueOn(r: Recurrence, date: Date = new Date()): boolean {
  const start = parseDate(r.startDate);
  if (daysBetween(start, date) < 0) return false;

  const dayOfMonth = date.getDate(); // 1-31
  const lastDayOfMonth = daysInMonth(date); // 28-31
  const monthsSinceStart =
    (date.getFullYear() - start.getFullYear()) * 12 +
    (date.getMonth() - start.getMonth());

  switch (r.type) {
    // Every N days
    case "daily": {
      const daysSinceStart = daysBetween(start, date);
      return daysSinceStart % r.every === 0;
    }

    // Some weekdays, every N weeks
    case "weekly": {
      // Is today one of the chosen weekdays?
      const isChosenDay = r.days.includes(date.getDay() as Weekday);
      if (!isChosenDay) return false;

      // Is this one of the "active" weeks?
      const weeksSinceStart =
        daysBetween(startOfWeek(start), startOfWeek(date)) / 7;
      return weeksSinceStart % r.every === 0;
    }

    // A day of the month, every N months
    case "monthly": {
      if (monthsSinceStart % r.every !== 0) return false;

      if (r.day === "last") return dayOfMonth === lastDayOfMonth;

      // "The 31st" in a shorter month falls on its last day instead.
      return dayOfMonth === Math.min(r.day, lastDayOfMonth);
    }

    // "First Monday", "last Friday"... every N months
    case "monthlyNth": {
      if (monthsSinceStart % r.every !== 0) return false;
      if (date.getDay() !== r.weekday) return false;

      // Last one: there is no same weekday later this month.
      if (r.nth === -1) return dayOfMonth + 7 > lastDayOfMonth;

      // Days 1-7 = 1st, 8-14 = 2nd, 15-21 = 3rd, 22-28 = 4th
      const weekOfMonth = Math.ceil(dayOfMonth / 7);
      return weekOfMonth === r.nth;
    }

    // Once a year
    case "yearly": {
      const month = date.getMonth() + 1; // 1-12
      if (month !== r.month) return false;

      // Feb 29 falls on Feb 28 in non-leap years.
      return dayOfMonth === Math.min(r.day, lastDayOfMonth);
    }
  }
}

// NEXT DUE

// Number of days until the habit is next due (0 = today, 1 = tomorrow...).
// Checks each day one by one, starting from today. null = never due within ~2 years.
export function daysUntilNext(
  r: Recurrence,
  from: Date = new Date(),
): number | null {
  for (let i = 0; i <= 800; i++) {
    const day = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate() + i,
    );
    if (isDueOn(r, day)) return i;
  }
  return null;
}

// CONTEXT
// Shares the habits list with every screen.

// What every screen gets from useHabits()
type HabitsContextType = {
  habits: Habit[];
  completions: Completions;
  pet: Pet | null;
  owned: string[];
  equipped: string[];
  buyItem: (id: string) => boolean;
  toggleEquip: (id: string) => void;
  hatchPet: (name: string, color: SlimeColor) => void;
  resetAccount: () => void; // TESTING
  apples: number; // number of apples earned by completing habits
  fullness: Fullness;
  feedPet: () => boolean;
  spendApples: (amount: number) => boolean;
  loaded: boolean; // false while the saved data is being read at startup
  addHabit: (habit: NewHabit) => void;
  updateHabit: (id: number, changes: Partial<NewHabit>) => void;
  removeHabit: (id: number) => void;
  timesDone: (habitId: number, date?: string) => number; // how many times done that day (today by default)
  markDone: (habitId: number) => void; // +1 for today (up to timesPerDay)
  resetDone: (habitId: number) => void; // back to 0 for today
  resetAll: (withExamples?: boolean) => void; // TESTING: deletes everything (optionally puts the example habits back)
};

// Starts as undefined so we can detect a missing <HabitsProvider>.
const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

// SAVING
// Everything is saved on the phone under this key (habits + completions together).

// 5. PROVIDER

export function HabitsProvider({
  uid,
  children,
}: {
  uid: string;
  children: ReactNode;
}) {
  // The list of all habits.
  const [habits, setHabits] = useState<Habit[]>([]);
  // Which habits were done, and when.
  const [completions, setCompletions] = useState<Completions>({});
  // Becomes true once the saved data has been read (so we don't save an empty list over it).
  const [loaded, setLoaded] = useState(false);
  // Counter for apples
  const [apples, setApples] = useState(100);
  // How full the pet is (a new user starts at 0, now)
  const [fullness, setFullness] = useState<Fullness>(() => ({
    value: 0,
    updatedAt: Date.now(),
  }));
  // The pet, or null when the egg has not hatched yet
  const [pet, setPet] = useState<Pet | null>(null);

  // Shop: the ids of the items bought, and of the items in use
  const [owned, setOwned] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<string[]>([]);

  const dataPath = `users/${uid}`;

  // Load the saved data once, when the app starts
  // Load the saved data once, when the app starts
  useEffect(() => {
    get(ref(database, dataPath))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const saved = snapshot.val();
          setFullness(saved.fullness ?? { value: 0, updatedAt: Date.now() });
          setPet(saved.pet ?? null);
          setHabits(saved.habits ?? []);
          setOwned(saved.owned ?? []);
          setEquipped(saved.equipped ?? []);
          setCompletions(saved.completions ?? {});
          setApples(saved.apples ?? 100);
        } else {
          setHabits(PLACEHOLDER_HABITS); // TODO: first launch with nothing saved -> [] before submitting
        }
        setLoaded(true); // only when loading worked
      })
      .catch((error) => console.warn("Could not load the saved habits", error));
  }, [dataPath]);

  // Save every time the habits, the completions or the apples change
  useEffect(() => {
    if (!loaded) return; // not loaded yet: saving now would erase the saved data
    set(ref(database, dataPath), {
      habits,
      completions,
      fullness,
      pet,
      apples,
      owned,
      equipped,
    }).catch((error) => console.warn("Could not save the habits", error));
  }, [
    habits,
    completions,
    loaded,
    apples,
    dataPath,
    owned,
    equipped,
    fullness,
    pet,
  ]);
  // Adds a new habit to the end of the list.
  function addHabit(habit: NewHabit) {
    setHabits((previous) => [
      ...previous, // keep the existing habits
      { ...habit, id: Date.now() }, // add the new one, with a unique id (stays unique after a delete)
    ]);
  }

  // Changes some fields of one habit, keeps the rest.
  function updateHabit(id: number, changes: Partial<NewHabit>) {
    setHabits((previous) =>
      previous.map((habit) =>
        habit.id === id ? { ...habit, ...changes } : habit,
      ),
    );
  }

  // Removes one habit from the list, and its completions with it.
  function removeHabit(id: number) {
    setHabits((previous) => previous.filter((habit) => habit.id !== id));
    setCompletions((previous) => {
      const copy = { ...previous };
      delete copy[id];
      return copy;
    });
  }

  // How many times a habit was done on a day (today by default).
  function timesDone(habitId: number, date: string = todayString()): number {
    return completions[habitId]?.[date] ?? 0;
  }

  // Counts one more time done today (never more than timesPerDay).
  // Counts one more time done today (never more than timesPerDay).
  // Gives the habit's strength in apples when the day becomes complete.
  function markDone(habitId: number) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const today = todayString();

    const done = timesDone(habitId); // times done today, BEFORE this tap
    if (done >= habit.timesPerDay) return; // already complete: nothing to add

    setCompletions((previous) => ({
      ...previous,
      [habitId]: { ...previous[habitId], [today]: done + 1 },
    }));

    // This tap completes the day -> reward
    if (done + 1 === habit.timesPerDay) {
      setApples((current) => current + habit.strength);
    }
  }

  // Cancels today's completions for a habit (e.g. ticked by mistake).
  function resetDone(habitId: number) {
    const habit = habits.find((h) => h.id === habitId);
    const today = todayString();

    const wasComplete =
      habit !== undefined && timesDone(habitId) >= habit.timesPerDay;

    setCompletions((previous) => {
      const days = { ...previous[habitId] };
      delete days[today];
      return { ...previous, [habitId]: days };
    });

    if (wasComplete) {
      setApples((current) => Math.max(0, current - habit.strength)); // Takes the apples back if the day had been completed.
    }
  }
  // let us spend apples when we give an apple to the tamagotchi. Returns true if there were enough apples, false if not.
  function spendApples(amount: number): boolean {
    if (apples < amount) return false; // not enough: nothing happens
    setApples((current) => current - amount);
    return true;
  }

  // Feeds the pet: costs 1 apple, adds 1 fullness. Returns false if full or no apple.
  function feedPet(): boolean {
    const now = Date.now();
    const current = currentFullness(fullness, now);
    if (current >= MAX_FULLNESS) return false; // already full
    if (!spendApples(1)) return false; // no apple
    setFullness({ value: current + 1, updatedAt: now });
    return true;
  }

  // Buys an item with apples, and equips it right away. Returns false if not possible.
  function buyItem(id: string): boolean {
    const item = findItem(id);
    if (!item || owned.includes(id)) return false; // unknown, or already bought
    if (!spendApples(item.price)) return false; // not enough apples
    setOwned((current) => [...current, id]);
    toggleEquip(id);
    return true;
  }

  // Equips an item, or takes it off if it is already equipped.
  // For "only one" categories (beanbag, house), it replaces the other one.
  function toggleEquip(id: string) {
    const item = findItem(id);
    if (!item) return;
    const onlyOne = CATEGORIES.find((c) => c.id === item.category)?.onlyOne;

    setEquipped((current) => {
      if (current.includes(id)) return current.filter((e) => e !== id); // take it off
      const kept = onlyOne
        ? current.filter((e) => findItem(e)?.category !== item.category) // remove the old one
        : current;
      return [...kept, id];
    });
  }

  // The egg hatched: the pet is born
  function hatchPet(name: string, color: SlimeColor) {
    setPet({ name, color, bornAt: Date.now() });
  }

  // TESTING: back to a brand new account (the egg comes back)
  function resetAccount() {
    setHabits(PLACEHOLDER_HABITS); // TODO: [] before submitting
    setCompletions({});
    setApples(100);
    setFullness({ value: 0, updatedAt: Date.now() });
    setPet(null);
    setOwned([]);
    setEquipped([]);
  }

  // TESTING: deletes all habits and completions (the save effect then saves the empty state).
  function resetAll(withExamples: boolean = false) {
    setHabits(withExamples ? PLACEHOLDER_HABITS : []);
    setCompletions({});
  }

  return (
    <HabitsContext.Provider
      value={{
        habits,
        completions,
        apples,
        fullness,
        feedPet,
        pet,
        hatchPet,
        resetAccount,
        spendApples,
        loaded,
        addHabit,
        updateHabit,
        removeHabit,
        timesDone,
        markDone,
        resetDone,
        owned,
        equipped,
        buyItem,
        toggleEquip,
        resetAll,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
}

// HOOK
// How screens read the habits.

// Use in any screen: const { habits, addHabit } = useHabits();
export function useHabits() {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error("useHabits must be used inside a <HabitsProvider>");
  }
  return context;
}

//Imports
import { createContext, useContext, useState, type ReactNode } from 'react';
import { PLACEHOLDER_HABITS } from './placeholderHabits'; // TODO: remove before submitting

// TYPES

// Day of the week 
export type Weekday =
  | 0  // Sunday
  | 1  // Monday
  | 2  // Tuesday
  | 3  // Wednesday
  | 4  // Thursday
  | 5  // Friday
  | 6; // Saturday

// Recurrence rules for habits. Each habit has one of these. But the rules are flexible: you can do a habit every day, or only on certain days of the week, or only on certain days of the month, etc.
export type Recurrence =
  | {
      type: 'daily'; //every day
      every: number;
      startDate: string;
    }
  | {
      type: 'weekly'; // once a week
      every: number;
      days: Weekday[]; // which days of the week
      startDate: string;
    }
  | {
      type: 'monthly'; // once a month
      every: number;
      day: number | 'last'; // day of the month (1-31), or 'last' - to avoid issues with months that have fewer than 31 days
      startDate: string;
    }
  | {
      type: 'monthlyNth'; // e.g. "the 2nd Tuesday of every month"
      every: number;
      nth: 1 | 2 | 3 | 4 | -1; // 1 = first, 2 = second... -1 = last
      weekday: Weekday;
      startDate: string;
    }
  | {
      type: 'yearly'; // once a year
      month: number; // 1 = January ... 12 = December
      day: number;   // day of the month (1-31)
      startDate: string;
    };

// One habit (one item in the FlatList). 
export type Habit = {
  id: number;
  name: string;
  description: string;
  recurrence: Recurrence; // which days it happens
  timesPerDay: number;    // how many times on those days (1 = once, default value)
  strength: number;       // difficulty, from 1 (easy) to 10 (hard)
};

// habit before it is saved: everything except the id, created here
export type NewHabit = Omit<Habit, 'id'>;


// DATE HELPERS

// Today as 'YYYY-MM-DD' (used as the default start date in the form)
export function todayString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Turns 'YYYY-MM-DD' into a Date (local time, midnight)
function parseDate(ymd: string): Date {
  const [year, month, day] = ymd.split('-').map(Number);
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
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday);
}

// IS IT DUE?

//Returns true if the recurrence happens on `date` (today by default).

export function isDueOn(r: Recurrence, date: Date = new Date()): boolean {
  const start = parseDate(r.startDate);
  if (daysBetween(start, date) < 0) return false;

  const dayOfMonth = date.getDate();      // 1-31
  const lastDayOfMonth = daysInMonth(date); // 28-31
  const monthsSinceStart =
    (date.getFullYear() - start.getFullYear()) * 12 +
    (date.getMonth() - start.getMonth());

  switch (r.type) {
    // Every N days 
    case 'daily': {
      const daysSinceStart = daysBetween(start, date);
      return daysSinceStart % r.every === 0;
    }

    // Some weekdays, every N weeks 
    case 'weekly': {
      // Is today one of the chosen weekdays?
      const isChosenDay = r.days.includes(date.getDay() as Weekday);
      if (!isChosenDay) return false;

      // Is this one of the "active" weeks?
      const weeksSinceStart = daysBetween(startOfWeek(start), startOfWeek(date)) / 7;
      return weeksSinceStart % r.every === 0;
    }

    // A day of the month, every N months 
    case 'monthly': {
      if (monthsSinceStart % r.every !== 0) return false;

      if (r.day === 'last') return dayOfMonth === lastDayOfMonth;

      // "The 31st" in a shorter month falls on its last day instead.
      return dayOfMonth === Math.min(r.day, lastDayOfMonth);
    }

    // "First Monday", "last Friday"... every N months
    case 'monthlyNth': {
      if (monthsSinceStart % r.every !== 0) return false;
      if (date.getDay() !== r.weekday) return false;

      // Last one: there is no same weekday later this month.
      if (r.nth === -1) return dayOfMonth + 7 > lastDayOfMonth;

      // Days 1-7 = 1st, 8-14 = 2nd, 15-21 = 3rd, 22-28 = 4th
      const weekOfMonth = Math.ceil(dayOfMonth / 7);
      return weekOfMonth === r.nth;
    }

    // Once a year 
    case 'yearly': {
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
export function daysUntilNext(r: Recurrence, from: Date = new Date()): number | null {
  for (let i = 0; i <= 800; i++) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    if (isDueOn(r, day)) return i;
  }
  return null;
}

// CONTEXT
// Shares the habits list with every screen.

// What every screen gets from useHabits()
type HabitsContextType = {
  habits: Habit[];
  addHabit: (habit: NewHabit) => void;
  updateHabit: (id: number, changes: Partial<NewHabit>) => void;
  removeHabit: (id: number) => void;
};

// Starts as undefined so we can detect a missing <HabitsProvider>.
const HabitsContext = createContext<HabitsContextType | undefined>(undefined);


// 5. PROVIDER

export function HabitsProvider({ children }: { children: ReactNode }) {
  // The list of all habits.
  const [habits, setHabits] = useState<Habit[]>(PLACEHOLDER_HABITS); // TODO: back to [] before submitting

  // Adds a new habit to the end of the list.
  function addHabit(habit: NewHabit) {
    setHabits((previous) => [
      ...previous,                    // keep the existing habits
      { ...habit, id: Date.now() },   // add the new one, with a unique id (stays unique after a delete)
    ]);
  }

  // Changes some fields of one habit, keeps the rest.
  function updateHabit(id: number, changes: Partial<NewHabit>) {
    setHabits((previous) =>
      previous.map((habit) => (habit.id === id ? { ...habit, ...changes } : habit))
    );
  }

  // Removes one habit from the list.
  function removeHabit(id: number) {
    setHabits((previous) => previous.filter((habit) => habit.id !== id));
  }

  return (
    <HabitsContext.Provider value={{ habits, addHabit, updateHabit, removeHabit }}>
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
    throw new Error('useHabits must be used inside a <HabitsProvider>');
  }
  return context;
}
// PLACEHOLDER HABITS
// Example habits loaded when the app starts, so the list is never empty while developing.
// TO REMOVE BEFORE SUBMITTING:
//   1. Delete this file
//   2. In HabitsContext.tsx, remove the import and use useState<Habit[]>([]) again

//Imports (types only, to avoid a circular import with HabitsContext)
import type { Habit } from './HabitsContext';

// Today as 'YYYY-MM-DD', so the examples always start today
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

export const PLACEHOLDER_HABITS: Habit[] = [
  {
    id: 1,
    name: 'Drink water',
    description: 'A full glass each time',
    recurrence: { type: 'daily', every: 1, startDate: today },
    timesPerDay: 3,
    strength: 2,
  },
  {
    id: 2,
    name: 'Go for a run',
    description: 'At least 20 minutes',
    recurrence: { type: 'daily', every: 2, startDate: today },
    timesPerDay: 1,
    strength: 7,
  },
  {
    id: 3,
    name: 'Water the plants',
    description: 'Living room and balcony',
    recurrence: { type: 'weekly', every: 1, days: [1, 4], startDate: today }, // Mon, Thu
    timesPerDay: 1,
    strength: 2,
  },
  {
    id: 4,
    name: 'Clean the bathroom',
    description: 'Shower, sink and floor',
    recurrence: { type: 'weekly', every: 2, days: [6], startDate: today }, // every 2 Saturdays
    timesPerDay: 1,
    strength: 8,
  },
  {
    id: 5,
    name: 'Pay the rent',
    description: '',
    recurrence: { type: 'monthly', every: 1, day: 1, startDate: today }, // 1st of the month
    timesPerDay: 1,
    strength: 3,
  },
  {
    id: 6,
    name: 'Clean the fridge',
    description: 'Throw away old food first',
    recurrence: { type: 'monthlyNth', every: 1, nth: -1, weekday: 5, startDate: today }, // last Friday
    timesPerDay: 1,
    strength: 5,
  },
  {
    id: 7,
    name: 'Car check-up',
    description: 'Book the garage a week before',
    recurrence: { type: 'yearly', month: 3, day: 20, startDate: today }, // March 20
    timesPerDay: 1,
    strength: 4,
  },
];
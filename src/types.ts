export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  type: MealType;
  name: string;
  kcal: number;
  carbs: number; // in grams
  protein: number; // in grams
  fat: number; // in grams
}

export interface PeriodData {
  active: boolean;
  flow: 'light' | 'medium' | 'heavy' | null;
  symptoms: string[];
}

export interface DailyNote {
  diary: string | null; // 오늘의 일기
  good: string | null; // 잘한 일
  bad: string | null; // 잘못한 일
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  meals: Meal[];
  water: number; // Number of cups (1 cup = 250ml)
  steps: number | null;
  sleepH: number | null; // Hours
  sleepQ: number | null; // Quality (1-5)
  weight: number | null; // kg
  mood: number | null; // Mood (1-5)
  period: PeriodData | null;
  note: DailyNote | null; // 마음 기록
}

export type VideoCategory = 'yoga' | 'meditation' | 'stretch' | 'breath';

export interface Video {
  id: string;
  vid: string; // YouTube video ID (11 chars)
  title: string;
  cat: VideoCategory;
}

export interface UserGoals {
  water: number; // target cups (e.g., 8)
  steps: number; // target steps (e.g., 8000)
  sleep: number; // target hours (e.g., 8)
  kcal: number; // target calories (e.g., 2000)
}

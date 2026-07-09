import { supabase } from './supabaseClient';
import { DailyRecord, Video, UserGoals } from '../types';

// --- Goals ---

export async function fetchGoals(userId: string): Promise<UserGoals | null> {
  const { data, error } = await supabase
    .from('user_goals')
    .select('water, steps, sleep, kcal')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertGoals(userId: string, goals: UserGoals): Promise<void> {
  const { error } = await supabase
    .from('user_goals')
    .upsert({ user_id: userId, ...goals }, { onConflict: 'user_id' });

  if (error) throw error;
}

// --- Videos ---

export async function fetchVideos(userId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('id, vid, title, cat')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function insertVideos(userId: string, videos: Omit<Video, 'id'>[]): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .insert(videos.map((v) => ({ user_id: userId, ...v })))
    .select('id, vid, title, cat');

  if (error) throw error;
  return data ?? [];
}

export async function insertVideo(userId: string, video: Omit<Video, 'id'>): Promise<Video> {
  const [inserted] = await insertVideos(userId, [video]);
  return inserted;
}

export async function deleteVideo(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) throw error;
}

// --- Daily Records ---

type DailyRecordRow = {
  date: string;
  meals: DailyRecord['meals'];
  water: number;
  steps: number | null;
  sleep_h: number | null;
  sleep_q: number | null;
  weight: number | null;
  mood: number | null;
  period: DailyRecord['period'];
  note: DailyRecord['note'];
};

function rowToRecord(row: DailyRecordRow): DailyRecord {
  return {
    date: row.date,
    meals: row.meals,
    water: row.water,
    steps: row.steps,
    sleepH: row.sleep_h,
    sleepQ: row.sleep_q,
    weight: row.weight,
    mood: row.mood,
    period: row.period,
    note: row.note,
  };
}

function recordToRow(userId: string, record: DailyRecord): DailyRecordRow & { user_id: string } {
  return {
    user_id: userId,
    date: record.date,
    meals: record.meals,
    water: record.water,
    steps: record.steps,
    sleep_h: record.sleepH,
    sleep_q: record.sleepQ,
    weight: record.weight,
    mood: record.mood,
    period: record.period,
    note: record.note,
  };
}

export async function fetchRecords(userId: string): Promise<DailyRecord[]> {
  const { data, error } = await supabase
    .from('daily_records')
    .select('date, meals, water, steps, sleep_h, sleep_q, weight, mood, period, note')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToRecord);
}

export async function upsertRecord(userId: string, record: DailyRecord): Promise<void> {
  const { error } = await supabase
    .from('daily_records')
    .upsert(recordToRow(userId, record), { onConflict: 'user_id,date' });

  if (error) throw error;
}

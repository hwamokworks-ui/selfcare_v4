import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  TrendingUp,
  Calendar,
  Video as VideoIcon,
  Heart,
  LogOut,
} from 'lucide-react';

import { DailyRecord, Video, UserGoals } from './types';
import { formatDate } from './utils/period';
import { DEFAULT_GOALS, SEED_VIDEOS } from './utils/seedData';
import * as api from './lib/api';

// Sub-tabs imports
import TodayTab from './components/TodayTab';
import TrendTab from './components/TrendTab';
import CalendarTab from './components/CalendarTab';
import VideoTab from './components/VideoTab';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

interface AppProps {
  userId: string;
  userEmail: string;
  onSignOut: () => void;
}

export default function App({ userId, userEmail, onSignOut }: AppProps) {
  const [currentTab, setCurrentTab] = useState<'today' | 'trends' | 'calendar' | 'videos'>('today');

  const now = new Date();
  const todayStr = formatDate(now);
  const todayWeekday = WEEKDAY_LABELS[now.getDay()];

  // --- Core States ---
  const [allRecords, setAllRecords] = useState<DailyRecord[]>([]);
  const [goals, setGoals] = useState<UserGoals>(DEFAULT_GOALS);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [loadedGoals, loadedVideos, loadedRecords] = await Promise.all([
        api.fetchGoals(userId),
        api.fetchVideos(userId),
        api.fetchRecords(userId),
      ]);

      if (loadedGoals) {
        setGoals(loadedGoals);
      } else {
        await api.upsertGoals(userId, DEFAULT_GOALS);
        setGoals(DEFAULT_GOALS);
      }

      if (loadedVideos.length > 0) {
        setVideos(loadedVideos);
      } else {
        const seeded = await api.insertVideos(userId, SEED_VIDEOS.map(({ vid, title, cat }) => ({ vid, title, cat })));
        setVideos(seeded);
      }

      setAllRecords(loadedRecords);
    } catch (e) {
      console.error('Error loading data from Supabase', e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  // Load from Supabase on mount / when the logged-in user changes
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Set up global callback hook for TodayTab goals setup
  useEffect(() => {
    (window as any)._updateGoals = async (updatedGoals: UserGoals) => {
      setGoals(updatedGoals);
      try {
        await api.upsertGoals(userId, updatedGoals);
      } catch (e) {
        console.error('Error saving goals', e);
        setSyncError('동기화 실패, 다시 시도해 주세요');
      }
    };
    return () => {
      delete (window as any)._updateGoals;
    };
  }, [userId]);

  // Update a single field inside a given date's record
  const handleUpdateRecordForDate = async (dateStr: string, updatedFields: Partial<DailyRecord>) => {
    const existing = allRecords.find((r) => r.date === dateStr) || {
      date: dateStr,
      meals: [],
      water: 0,
      steps: null,
      sleepH: null,
      sleepQ: null,
      weight: null,
      mood: null,
      period: null,
      note: null,
    };
    const updatedRecord: DailyRecord = { ...existing, ...updatedFields };

    const updatedRecords = allRecords.some((r) => r.date === dateStr)
      ? allRecords.map((rec) => (rec.date === dateStr ? updatedRecord : rec))
      : [...allRecords, updatedRecord];

    setAllRecords(updatedRecords);
    try {
      await api.upsertRecord(userId, updatedRecord);
    } catch (e) {
      console.error('Error saving record', e);
      setSyncError('동기화 실패, 다시 시도해 주세요');
    }
  };

  const handleUpdateTodayRecord = (updatedFields: Partial<DailyRecord>) =>
    handleUpdateRecordForDate(todayStr, updatedFields);

  // --- Videos manipulation callbacks ---
  const handleAddVideo = async (newVideoData: Omit<Video, 'id'>) => {
    try {
      const newVid = await api.insertVideo(userId, newVideoData);
      setVideos([newVid, ...videos]);
    } catch (e) {
      console.error('Error adding video', e);
      setSyncError('동기화 실패, 다시 시도해 주세요');
    }
  };

  const handleRemoveVideo = async (id: string) => {
    const updatedVideos = videos.filter((v) => v.id !== id);
    setVideos(updatedVideos);
    try {
      await api.deleteVideo(userId, id);
    } catch (e) {
      console.error('Error removing video', e);
      setSyncError('동기화 실패, 다시 시도해 주세요');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono font-bold text-[#737373] tracking-widest uppercase">LOADING...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-4">
        <span className="text-sm font-bold text-[#2A2723]">불러오지 못했어요</span>
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-full bg-[#6F8F6A] text-white text-xs font-bold"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const todayRecord = allRecords.find((r) => r.date === todayStr) || {
    date: todayStr,
    meals: [],
    water: 0,
    steps: null,
    sleepH: null,
    sleepQ: null,
    weight: null,
    mood: null,
    period: null,
    note: null,
  };

  return (
    <div className="min-h-screen bg-transparent text-[#2A2723] font-sans antialiased selection:bg-[#F2EEE2] pb-24">
      {/* Upper Brand Nav Rail (Clean Organic Minimalism) */}
      <header className="sticky top-0 bg-[#F5F2EA]/90 backdrop-blur-md border-b border-[#E4DECF]/60 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#6F8F6A]"></div>
              <span className="font-bold tracking-tight text-sm text-[#2A2723] font-serif">오늘의 건강</span>
            </div>
            <div className="px-1.5 py-0.5 bg-[#EEE9DD] border border-[#E4DECF] text-[#8A8271] text-[9px] font-mono rounded font-bold uppercase tracking-wider">
              SAVED
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-[#8A8271] bg-[#EEE9DD]/60 px-2.5 py-1 rounded border border-[#E4DECF]">
              {todayStr} ({todayWeekday})
            </span>
            <button
              onClick={onSignOut}
              title={userEmail}
              className="p-1.5 rounded-full text-[#8A8271] hover:text-[#2A2723] hover:bg-[#F2EEE2] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {syncError && (
          <div className="max-w-2xl mx-auto px-4 pb-2 -mt-1">
            <div className="text-[10px] font-mono font-bold text-red-700 bg-red-50 border border-red-200 rounded px-2.5 py-1">
              {syncError}
            </div>
          </div>
        )}
      </header>

      {/* Main Container Stage */}
      <main className="max-w-2xl mx-auto px-4 pt-6 min-h-[calc(100vh-120px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {currentTab === 'today' && (
              <TodayTab
                record={todayRecord}
                goals={goals}
                onUpdateRecord={handleUpdateTodayRecord}
                allRecords={allRecords}
                todayStr={todayStr}
              />
            )}
            {currentTab === 'trends' && (
              <TrendTab
                allRecords={allRecords}
                goals={goals}
              />
            )}
            {currentTab === 'calendar' && (
              <CalendarTab
                allRecords={allRecords}
                goals={goals}
                todayStr={todayStr}
                onUpdateRecord={handleUpdateRecordForDate}
              />
            )}
            {currentTab === 'videos' && (
              <VideoTab
                videos={videos}
                onAddVideo={handleAddVideo}
                onRemoveVideo={handleRemoveVideo}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Persistent Beautiful Fixed Bottom Tab Bar (Clean Organic Minimalism) */}
      <nav className="fixed bottom-5 inset-x-4 max-w-sm mx-auto bg-[#FBF9F3]/95 backdrop-blur-md rounded-full border border-[#E4DECF] shadow-lg p-1.5 z-40 flex items-center justify-around">
        {[
          { id: 'today' as const, label: '오늘', icon: Sparkles },
          { id: 'trends' as const, label: '추세', icon: TrendingUp },
          { id: 'calendar' as const, label: '달력', icon: Calendar },
          { id: 'videos' as const, label: '영상', icon: VideoIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`relative flex-1 py-2 rounded-full flex flex-col items-center justify-center gap-1.5 transition-colors ${
                active ? 'text-white' : 'text-[#8A8271] hover:text-[#2A2723]'
              }`}
              id={`nav-tab-${tab.id}`}
            >
              {active && (
                <motion.div
                  layoutId="nav-active-pill"
                  className="absolute inset-0 bg-[#6F8F6A] rounded-full shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="relative z-10 w-4 h-4" />
              <span className="relative z-10 text-[10px] font-bold tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

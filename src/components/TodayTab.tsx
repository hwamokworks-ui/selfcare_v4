import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Droplet,
  Footprints,
  Moon,
  Utensils,
  Smile,
  Scale,
  CalendarDays,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Sparkles,
  Info,
  X,
  TrendingUp,
  Heart
} from 'lucide-react';
import { DailyRecord, Meal, MealType, PeriodData, UserGoals } from '../types';
import { predictPeriod, getDaysDiff } from '../utils/period';

interface TodayTabProps {
  record: DailyRecord;
  goals: UserGoals;
  onUpdateRecord: (updated: Partial<DailyRecord>) => void;
  allRecords: DailyRecord[];
  todayStr: string;
}

export default function TodayTab({
  record,
  goals,
  onUpdateRecord,
  allRecords,
  todayStr,
}: TodayTabProps) {
  // Active modal state: 'water' | 'steps' | 'sleep' | 'meal' | 'mood' | 'weight' | 'period' | 'goals' | null
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // --- Meal Form State ---
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [mealName, setMealName] = useState('');
  const [mealKcal, setMealKcal] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealFat, setMealFat] = useState('');

  // --- Goal Form State ---
  const [goalWater, setGoalWater] = useState(goals.water);
  const [goalSteps, setGoalSteps] = useState(goals.steps);
  const [goalSleep, setGoalSleep] = useState(goals.sleep);
  const [goalKcal, setGoalKcal] = useState(goals.kcal);

  // --- Mind Record (마음 기록) Form State ---
  const [noteDiary, setNoteDiary] = useState(record.note?.diary ?? '');
  const [noteGood, setNoteGood] = useState(record.note?.good ?? '');
  const [noteBad, setNoteBad] = useState(record.note?.bad ?? '');

  const commitNote = () => {
    const trimmedDiary = noteDiary.trim();
    const trimmedGood = noteGood.trim();
    const trimmedBad = noteBad.trim();
    const nextNote = trimmedDiary || trimmedGood || trimmedBad
      ? {
          diary: trimmedDiary ? noteDiary : null,
          good: trimmedGood ? noteGood : null,
          bad: trimmedBad ? noteBad : null,
        }
      : null;

    const current = record.note;
    const unchanged =
      (current?.diary ?? null) === (nextNote?.diary ?? null) &&
      (current?.good ?? null) === (nextNote?.good ?? null) &&
      (current?.bad ?? null) === (nextNote?.bad ?? null);

    if (!unchanged) {
      onUpdateRecord({ note: nextNote });
    }
  };

  // Greetings based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '상쾌하고 든든한 아침입니다! ☀️';
    if (hour >= 12 && hour < 18) return '따뜻하고 활기찬 오후예요 🌿';
    return '편안하고 고요한 저녁 시간 보내세요 🌙';
  };

  // --- Calculations ---
  const waterProgress = record.water / goals.water;
  const stepsProgress = (record.steps || 0) / goals.steps;
  const sleepProgress = (record.sleepH || 0) / goals.sleep;

  // Meal Calories & Nutrition Calculations
  const totalMealKcal = record.meals.reduce((sum, m) => sum + m.kcal, 0);
  const mealProgress = Math.min(1, totalMealKcal / goals.kcal);

  const totalCarbs = record.meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalProtein = record.meals.reduce((sum, m) => sum + m.protein, 0);
  const totalFat = record.meals.reduce((sum, m) => sum + m.fat, 0);
  const totalMacrosGrams = totalCarbs + totalProtein + totalFat;

  // Percentage macros (for balance)
  const carbPct = totalMacrosGrams ? Math.round((totalCarbs / totalMacrosGrams) * 100) : 0;
  const protPct = totalMacrosGrams ? Math.round((totalProtein / totalMacrosGrams) * 100) : 0;
  const fatPct = totalMacrosGrams ? Math.round((totalFat / totalMacrosGrams) * 100) : 0;

  // Overall Goal Achievement (Avg of 4 core progress stats)
  const averageAchievement = Math.round(
    ((Math.min(1, waterProgress) +
      Math.min(1, stepsProgress) +
      Math.min(1, sleepProgress) +
      Math.min(1, mealProgress)) /
      4) *
      100
  );

  // Period Prediction info
  const prediction = predictPeriod(allRecords, todayStr);

  // Quick action increments
  const handleWaterIncrement = (amount: number) => {
    const nextVal = Math.max(0, record.water + amount);
    onUpdateRecord({ water: nextVal });
  };

  const handleQuickSteps = (amount: number) => {
    const nextVal = (record.steps || 0) + amount;
    onUpdateRecord({ steps: nextVal });
  };

  const handleQuickWeight = (amount: number) => {
    // default to 55 if null, then increment
    const current = record.weight || 55.0;
    const nextVal = Math.round((current + amount) * 10) / 10;
    onUpdateRecord({ weight: nextVal });
  };

  const handleMoodSelect = (moodVal: number) => {
    onUpdateRecord({ mood: moodVal });
    setActiveModal(null);
  };

  // --- Meal actions ---
  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim()) return;

    const newMeal: Meal = {
      id: `meal-${Date.now()}`,
      type: mealType,
      name: mealName,
      kcal: Number(mealKcal) || 0,
      carbs: Number(mealCarbs) || 0,
      protein: Number(mealProtein) || 0,
      fat: Number(mealFat) || 0,
    };

    onUpdateRecord({
      meals: [...record.meals, newMeal],
    });

    // Reset Form
    setMealName('');
    setMealKcal('');
    setMealCarbs('');
    setMealProtein('');
    setMealFat('');
  };

  const handleRemoveMeal = (id: string) => {
    onUpdateRecord({
      meals: record.meals.filter((m) => m.id !== id),
    });
  };

  // --- Period actions ---
  const handlePeriodToggle = () => {
    const wasActive = !!(record.period && record.period.active);
    if (wasActive) {
      // Turn off
      onUpdateRecord({
        period: null,
      });
    } else {
      // Turn on with defaults
      onUpdateRecord({
        period: {
          active: true,
          flow: 'medium',
          symptoms: [],
        },
      });
    }
  };

  const updatePeriodFlow = (flow: 'light' | 'medium' | 'heavy') => {
    const curPeriod = record.period || { active: true, flow: null, symptoms: [] };
    onUpdateRecord({
      period: {
        ...curPeriod,
        active: true,
        flow,
      },
    });
  };

  const togglePeriodSymptom = (symptom: string) => {
    const curPeriod = record.period || { active: true, flow: null, symptoms: [] };
    const symptoms = curPeriod.symptoms.includes(symptom)
      ? curPeriod.symptoms.filter((s) => s !== symptom)
      : [...curPeriod.symptoms, symptom];

    onUpdateRecord({
      period: {
        ...curPeriod,
        active: true,
        symptoms,
      },
    });
  };

  // Get mini 14-day weight sparkline coords
  const getWeightSparkline = () => {
    const weightRecords = allRecords
      .filter((r) => r.weight !== null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10); // last 10 records with weight

    if (weightRecords.length < 2) return null;

    const weights = weightRecords.map((r) => r.weight as number);
    const min = Math.min(...weights) - 0.5;
    const max = Math.max(...weights) + 0.5;
    const range = max - min;

    const width = 120;
    const height = 32;

    const points = weightRecords
      .map((r, idx) => {
        const x = (idx / (weightRecords.length - 1)) * width;
        const y = height - (((r.weight as number) - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');

    return { points, currentWeight: record.weight || weights[weights.length - 1] };
  };

  const sparklineData = getWeightSparkline();

  // Save Goal settings
  const handleSaveGoals = () => {
    // we would save goals at parent, let's trigger it by fake update, but actually parent controls it
    // we will pass it back in a custom custom callback or directly through updating the goal values
    // to keep it simple, we can pass it via onUpdateGoals if possible, but let's see if we can do this simply:
    // since we want goals to persist, we will let parent update goals when a state is triggered.
    // For now we will support editing goals inside TodayTab via local storage and callback.
    // Let's expect App.tsx will handle the goals updates
    (window as any)._updateGoals?.({
      water: Number(goalWater) || 8,
      steps: Number(goalSteps) || 8000,
      sleep: Number(goalSleep) || 8,
      kcal: Number(goalKcal) || 2000,
    });
    setActiveModal(null);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Upper Welcome Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold tracking-widest text-[#8A8271] uppercase">DAILY WELLNESS</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#2A2723] font-serif">{getGreeting()}</h1>
          <p className="text-xs text-[#8A8271]">오늘도 가볍고 건강하게 챙겨봐요.</p>
        </div>
        <button
          onClick={() => {
            setGoalWater(goals.water);
            setGoalSteps(goals.steps);
            setGoalSleep(goals.sleep);
            setGoalKcal(goals.kcal);
            setActiveModal('goals');
          }}
          className="px-4 py-2.5 bg-[#2A2723] hover:bg-[#413c34] transition text-xs font-bold text-white rounded-xl flex items-center gap-2"
          id="btn-goals-setup"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#6F8F6A]" />
          목표 설정
        </button>
      </div>

      {/* Main Sage Gradient Achievement Dashboard Row */}
      <div className="bg-gradient-to-br from-[#3B4A38] to-[#54684E] rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-center gap-8 shadow-[0_14px_34px_rgba(60,74,56,.28)] text-white">
        <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
          {/* SVG Ring Background & Progress */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
            {/* Outer Track */}
            <circle
              cx="65"
              cy="65"
              r="54"
              className="stroke-white/20"
              strokeWidth="11"
              fill="transparent"
            />
            {/* Progress Ring */}
            <motion.circle
              cx="65"
              cy="65"
              r="54"
              className="stroke-white"
              strokeWidth="11"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 54}
              initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - Math.min(100, averageAchievement) / 100) }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-3xl font-extrabold tracking-tight text-white leading-none">{averageAchievement}<span className="text-sm font-semibold">%</span></span>
            <p className="text-[10px] text-white/70 font-semibold tracking-wide mt-1">오늘 달성</p>
          </div>
        </div>

        {/* Dashboard Quick Stats Summary */}
        <div className="flex-1 w-full grid grid-cols-2 gap-x-6 gap-y-4">
          <div onClick={() => setActiveModal('water')} className="cursor-pointer hover:opacity-80 transition">
            <span className="text-xs text-white/60 font-medium block">수분</span>
            <span className="text-lg font-bold text-white mt-0.5">
              {record.water} <span className="text-xs font-normal text-white/70">/ {goals.water}잔</span>
            </span>
          </div>

          <div onClick={() => setActiveModal('steps')} className="cursor-pointer hover:opacity-80 transition">
            <span className="text-xs text-white/60 font-medium block">걸음</span>
            <span className="text-lg font-bold text-white mt-0.5">
              {(record.steps || 0).toLocaleString()} <span className="text-xs font-normal text-white/70">보</span>
            </span>
          </div>

          <div onClick={() => setActiveModal('sleep')} className="cursor-pointer hover:opacity-80 transition">
            <span className="text-xs text-white/60 font-medium block">수면</span>
            <span className="text-lg font-bold text-white mt-0.5">
              {record.sleepH || 0} <span className="text-xs font-normal text-white/70">시간</span>
            </span>
          </div>

          <div onClick={() => setActiveModal('meal')} className="cursor-pointer hover:opacity-80 transition">
            <span className="text-xs text-white/60 font-medium block">식단</span>
            <span className="text-lg font-bold text-white mt-0.5">
              {record.meals.length}끼 <span className="text-xs font-normal text-white/70">· {totalMealKcal}kcal</span>
            </span>
          </div>
        </div>
      </div>

      {/* Cards List Grid (Beautiful 8 cards matching the premium mockup design) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Water */}
        <div className="bg-white rounded-2xl border border-[rgba(42,39,35,.05)] shadow-[0_1px_2px_rgba(42,39,35,.04),0_10px_26px_rgba(42,39,35,.05)] overflow-hidden flex flex-col justify-between p-5 hover:bg-[#FBF9F3]/30 transition duration-300">
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="p-3 bg-[#E7F1FA] text-[#4A90C7] rounded-xl border-none">
                <Droplet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#2A2723]">수분</h3>
                <p className="text-xs text-[#8A8271] mt-0.5">하루 목표 {goals.water}잔 ({(goals.water * 250 / 1000).toFixed(1)}L)</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-[#2A2723]">{record.water * 250} ml</span>
              <span className="text-xs text-[#8A8271] block">({record.water}잔)</span>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {/* Custom progress bar */}
            <div className="w-full bg-[#EEE9DD] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#4A90C7] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, waterProgress * 100)}%` }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleWaterIncrement(-1)}
                className="flex-1 py-2.5 bg-[#FBF9F3] border border-[#E4DECF] hover:bg-[#F2EEE2] text-[#7C7669] rounded-xl text-xs font-bold transition flex justify-center items-center gap-1"
                id="btn-water-minus"
              >
                <Minus className="w-3.5 h-3.5" /> 한 잔 빼기
              </button>
              <button
                onClick={() => handleWaterIncrement(1)}
                className="flex-2 py-2.5 bg-[#4A90C7] hover:bg-[#3E82B7] text-white rounded-xl text-xs font-bold transition flex justify-center items-center gap-1 border-none"
                id="btn-water-plus"
              >
                <Plus className="w-3.5 h-3.5" /> + 한 잔 (+250ml)
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Steps */}
        <div className="bg-white rounded-2xl border border-[rgba(42,39,35,.05)] shadow-[0_1px_2px_rgba(42,39,35,.04),0_10px_26px_rgba(42,39,35,.05)] overflow-hidden flex flex-col justify-between p-5 hover:bg-[#FBF9F3]/30 transition duration-300">
          <div className="flex justify-between items-start" onClick={() => setActiveModal('steps')}>
            <div className="flex gap-3 cursor-pointer">
              <div className="p-3 bg-[#FBF0DE] text-[#D08A2E] rounded-xl border-none">
                <Footprints className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#2A2723]">걸음 수</h3>
                <p className="text-xs text-[#8A8271] mt-0.5">하루 목표 {goals.steps.toLocaleString()}보</p>
              </div>
            </div>
            <div className="text-right cursor-pointer">
              <span className="text-lg font-extrabold text-[#2A2723]">{(record.steps || 0).toLocaleString()}</span>
              <span className="text-xs text-[#8A8271] block">/ {goals.steps.toLocaleString()}보</span>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {/* Custom progress bar */}
            <div className="w-full bg-[#EEE9DD] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#D08A2E] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, stepsProgress * 100)}%` }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleQuickSteps(1000)}
                className="flex-1 py-2.5 bg-[#FBF9F3] border border-[#E4DECF] hover:bg-[#F2EEE2] text-[#2A2723] rounded-xl text-xs font-bold transition"
                id="btn-steps-1k"
              >
                +1,000보 추가
              </button>
              <button
                onClick={() => setActiveModal('steps')}
                className="flex-1 py-2.5 bg-[#FBF9F3] border border-[#E4DECF] hover:bg-[#F2EEE2] text-[#2A2723] rounded-xl text-xs font-bold transition flex justify-center items-center gap-1"
                id="btn-steps-manual"
              >
                걸음 기록 <ChevronRight className="w-3.5 h-3.5 text-[#8A8271]" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Sleep */}
        <div
          onClick={() => setActiveModal('sleep')}
          className="bg-white rounded-2xl border border-[rgba(42,39,35,.05)] shadow-[0_1px_2px_rgba(42,39,35,.04),0_10px_26px_rgba(42,39,35,.05)] p-5 hover:bg-[#FBF9F3]/30 transition duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="p-3 bg-[#ECEAF7] text-[#6E63B6] rounded-xl border-none">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#2A2723]">수면</h3>
                <p className="text-xs text-[#8A8271] mt-0.5">하루 목표 {goals.sleep}시간 수면</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-[#2A2723]">{record.sleepH || 0}시간</span>
              {record.sleepQ && (
                <div className="flex gap-0.5 justify-end mt-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full ${
                        i < (record.sleepQ || 0) ? 'bg-[#6E63B6]' : 'bg-[#EEE9DD]'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5">
            {record.sleepH ? (
              <div className="p-3.5 bg-[#FBF9F3] border border-[#E4DECF]/60 rounded-xl flex justify-between items-center text-xs text-[#2A2723]">
                <span className="text-[#8A8271] font-semibold">수면의 질 만족도</span>
                <span className="font-bold text-[#6E63B6]">
                  {record.sleepQ === 5 && '최고예요 😍'}
                  {record.sleepQ === 4 && '좋아요 🙂'}
                  {record.sleepQ === 3 && '보통이에요 😐'}
                  {record.sleepQ === 2 && '별로예요 🥱'}
                  {record.sleepQ === 1 && '힘들었어요 😫'}
                </span>
              </div>
            ) : (
              <p className="text-xs text-[#8A8271] bg-[#FBF9F3] border border-[#E4DECF]/60 p-3.5 rounded-xl font-bold text-center">
                수면 시간과 만족도를 기록해 보세요
              </p>
            )}
          </div>
        </div>

        {/* Card 4: Meals (Food) */}
        <div
          onClick={() => setActiveModal('meal')}
          className="bg-white rounded-2xl border border-[rgba(42,39,35,.05)] shadow-[0_1px_2px_rgba(42,39,35,.04),0_10px_26px_rgba(42,39,35,.05)] p-5 hover:bg-[#FBF9F3]/30 transition duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="p-3 bg-[#F7EAE1] text-[#C0663B] rounded-xl border-none">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#2A2723]">식단</h3>
                <p className="text-xs text-[#8A8271] mt-0.5">하루 목표 {goals.kcal} kcal</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-[#C0663B]">{totalMealKcal} kcal</span>
              <span className="text-xs text-[#8A8271] block">{record.meals.length}개의 식사</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {record.meals.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-16 overflow-hidden">
                {record.meals.map((meal) => (
                  <span
                    key={meal.id}
                    className="px-2.5 py-1 bg-[#FBF9F3] border border-[#EEE5DA] text-[#2A2723] rounded-xl text-[11px] font-bold flex items-center gap-1.5"
                  >
                    <span className="text-[#C0663B] font-bold">
                      {meal.type === 'breakfast' && '아침'}
                      {meal.type === 'lunch' && '점심'}
                      {meal.type === 'dinner' && '저녁'}
                      {meal.type === 'snack' && '간식'}
                    </span>
                    <span className="text-[#EEE5DA]">|</span>
                    <span className="max-w-[75px] truncate">{meal.name}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8A8271] bg-[#FBF9F3] border border-[#E4DECF]/60 p-3.5 rounded-xl font-bold text-center">
                오늘 먹은 음식을 가볍게 남겨보세요
              </p>
            )}
          </div>
        </div>

        {/* Card 5: Macro Balance (Nutrition) */}
        <div className="bg-white rounded-2xl border border-[rgba(42,39,35,.05)] shadow-[0_1px_2px_rgba(42,39,35,.04),0_10px_26px_rgba(42,39,35,.05)] p-5 hover:bg-[#FBF9F3]/30 transition duration-300 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="p-3 bg-[#EEF3EA] text-[#6F8F6A] rounded-xl border-none">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#2A2723]">영양 균형</h3>
                <p className="text-xs text-[#8A8271] mt-0.5">탄수화물 · 단백질 · 지방 비율</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#8A8271] font-bold block">총 영양소</span>
              <span className="text-sm font-extrabold text-[#2A2723]">{totalMacrosGrams}g</span>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {/* Stacked macro bar */}
            <div className="w-full h-3 rounded-full bg-[#EEE9DD] overflow-hidden flex">
              {totalMacrosGrams > 0 ? (
                <>
                  <div className="bg-[#E0A04B] h-full transition-all" style={{ width: `${carbPct}%` }} title={`탄수화물 ${carbPct}%`} />
                  <div className="bg-[#6F8F6A] h-full transition-all" style={{ width: `${protPct}%` }} title={`단백질 ${protPct}%`} />
                  <div className="bg-[#C25E7A] h-full transition-all" style={{ width: `${fatPct}%` }} title={`지방 ${fatPct}%`} />
                </>
              ) : (
                <div className="bg-[#EEE9DD] w-full h-full" />
              )}
            </div>

            {totalMacrosGrams > 0 ? (
              <div className="grid grid-cols-3 gap-1.5 text-[11px] text-center">
                <div className="bg-white border border-[#E4DECF] text-[#2A2723] p-1.5 rounded-lg font-bold">
                  <span className="inline-block w-1.5 h-1.5 bg-[#E0A04B] rounded-xs mr-1"></span>탄 {totalCarbs}g ({carbPct}%)
                </div>
                <div className="bg-white border border-[#E4DECF] text-[#2A2723] p-1.5 rounded-lg font-bold">
                  <span className="inline-block w-1.5 h-1.5 bg-[#6F8F6A] rounded-xs mr-1"></span>단 {totalProtein}g ({protPct}%)
                </div>
                <div className="bg-white border border-[#E4DECF] text-[#2A2723] p-1.5 rounded-lg font-bold">
                  <span className="inline-block w-1.5 h-1.5 bg-[#C25E7A] rounded-xs mr-1"></span>지 {totalFat}g ({fatPct}%)
                </div>
              </div>
            ) : (
              <p className="text-xs text-center text-[#8A8271] bg-[#FBF9F3] py-2.5 rounded-xl border border-[#E4DECF]/60 font-semibold">식단을 추가하면 영양 비율이 분석됩니다.</p>
            )}
          </div>
        </div>

        {/* Card 6: Weight */}
        <div className="bg-white rounded-2xl border border-[rgba(42,39,35,.05)] shadow-[0_1px_2px_rgba(42,39,35,.04),0_10px_26px_rgba(42,39,35,.05)] p-5 hover:bg-[#FBF9F3]/30 transition duration-300 flex flex-col justify-between">
          <div className="flex justify-between items-start" onClick={() => setActiveModal('weight')}>
            <div className="flex gap-3 cursor-pointer">
              <div className="p-3 bg-[#EDEFE9] text-[#4E6B4A] rounded-xl border-none">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#2A2723]">체중</h3>
                <p className="text-xs text-[#8A8271] mt-0.5">매일 매일 가벼워지는 기록</p>
              </div>
            </div>
            <div className="text-right cursor-pointer">
              <span className="text-lg font-extrabold text-[#2A2723]">
                {record.weight ? `${record.weight} kg` : '기록 필요'}
              </span>
              <span className="text-[10px] text-[#8A8271] block">체중</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            {/* Mini sparkline or prompt */}
            <div className="flex-1 max-w-[130px] flex justify-center items-center">
              {sparklineData ? (
                <svg className="w-[120px] h-[32px]">
                  <polyline
                    fill="none"
                    stroke="#4E6B4A"
                    strokeWidth="2"
                    points={sparklineData.points}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span className="text-[11px] text-[#8A8271] text-center font-medium">추세 분석 진행 중</span>
              )}
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => handleQuickWeight(-0.1)}
                className="w-10 h-10 border border-[#E4DECF] bg-[#FBF9F3] hover:bg-[#F2EEE2] text-[#2A2723] rounded-xl text-xs font-bold flex items-center justify-center transition"
              >
                -0.1
              </button>
              <button
                onClick={() => handleQuickWeight(0.1)}
                className="w-10 h-10 border border-[#E4DECF] bg-[#FBF9F3] hover:bg-[#F2EEE2] text-[#2A2723] rounded-xl text-xs font-bold flex items-center justify-center transition"
              >
                +0.1
              </button>
              <button
                onClick={() => setActiveModal('weight')}
                className="px-3 h-10 bg-[#4E6B4A] hover:bg-[#40583C] text-white rounded-xl text-xs font-bold border-none transition"
              >
                입력
              </button>
            </div>
          </div>
        </div>

        {/* Card 7: Period */}
        <div
          onClick={() => setActiveModal('period')}
          className="bg-white rounded-2xl border border-[rgba(42,39,35,.05)] shadow-[0_1px_2px_rgba(42,39,35,.04),0_10px_26px_rgba(42,39,35,.05)] p-5 hover:bg-[#FBF9F3]/30 transition duration-300 cursor-pointer flex flex-col justify-between md:col-span-2"
        >
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="p-3 bg-[#F8E7EC] text-[#C25E7A] rounded-xl border-none">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#2A2723] font-serif">생리 주기</h3>
                <p className="text-xs text-[#8A8271] mt-0.5">
                  평균 주기: {prediction.averageCycle}일 | 예측 데이터 분석 진행 중
                </p>
              </div>
            </div>
            <div className="text-right">
              {prediction.isCurrentlyActive ? (
                <span className="px-3 py-1 bg-[#C25E7A] text-white text-xs font-extrabold rounded-lg shadow-sm">
                  생리 {prediction.currentDayNum || 1}일차
                </span>
              ) : prediction.dDay !== null ? (
                <span className="px-3 py-1 bg-[#FBF9F3] border border-[#E4DECF] text-[#2A2723] text-xs font-bold rounded-lg">
                  예상 주기 {prediction.dDay < 0 ? `+${Math.abs(prediction.dDay)}` : `D-${prediction.dDay}`}
                </span>
              ) : (
                <span className="px-3 py-1 bg-[#FBF9F3] border border-[#E4DECF] text-[#8A8271] text-xs font-bold rounded-lg">
                  기록 대기 중
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between p-3.5 bg-[#FBF9F3] border border-[#E4DECF]/60 rounded-xl">
            <div className="text-xs">
              <p className="font-bold text-[#2A2723]">
                {prediction.isCurrentlyActive ? '현재 생리가 기록되어 있습니다.' : '다음 예상 시작일'}
              </p>
              <p className="text-[#8A8271] mt-0.5">
                {prediction.isCurrentlyActive
                  ? `${record.period?.flow === 'light' ? '양 적음' : record.period?.flow === 'heavy' ? '양 많음' : '양 보통'} · 증상 ${record.period?.symptoms.length || 0}개`
                  : prediction.nextPredictedDate
                  ? `${prediction.nextPredictedDate} 예정`
                  : '달력에 생리 기록을 추가하면 주기가 자동 예측됩니다.'}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePeriodToggle();
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition border-none ${
                prediction.isCurrentlyActive
                  ? 'bg-[#C25E7A] text-white hover:bg-[#A94A64]'
                  : 'bg-white border border-[#E4DECF] text-[#2A2723] hover:bg-[#F2EEE2]'
              }`}
            >
              {prediction.isCurrentlyActive ? '생리 종료하기' : '생리 시작 기록'}
            </button>
          </div>
        </div>

        {/* Card 8: Mood/Condition */}
        <div
          onClick={() => setActiveModal('mood')}
          className="bg-white rounded-2xl border border-[rgba(42,39,35,.05)] shadow-[0_1px_2px_rgba(42,39,35,.04),0_10px_26px_rgba(42,39,35,.05)] p-5 hover:bg-[#FBF9F3]/30 transition duration-300 cursor-pointer flex flex-col justify-between md:col-span-2"
        >
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="p-3 bg-[#F4EEE0] text-[#B58A3C] rounded-xl border-none">
                <Smile className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#2A2723]">오늘의 컨디션</h3>
                <p className="text-xs text-[#8A8271] mt-0.5">오늘의 마음과 몸의 전반적인 기분</p>
              </div>
            </div>
            <div className="text-3xl">
              {record.mood === 5 && '😍'}
              {record.mood === 4 && '🙂'}
              {record.mood === 3 && '😐'}
              {record.mood === 2 && '🥱'}
              {record.mood === 1 && '😫'}
              {!record.mood && '❔'}
            </div>
          </div>

          <div className="mt-5">
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((level) => {
                const active = record.mood === level;
                let activeBg = 'bg-black';
                if (level === 1) activeBg = 'bg-[#C97C6B] text-white border-[#C97C6B]';
                if (level === 2) activeBg = 'bg-[#D69A55] text-white border-[#D69A55]';
                if (level === 3) activeBg = 'bg-[#C4B268] text-white border-[#C4B268]';
                if (level === 4) activeBg = 'bg-[#8FA36A] text-white border-[#8FA36A]';
                if (level === 5) activeBg = 'bg-[#6F8F6A] text-white border-[#6F8F6A]';

                return (
                  <button
                    key={level}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoodSelect(level);
                    }}
                    className={`py-3 rounded-xl text-lg flex flex-col items-center justify-center gap-1 transition font-bold border ${
                      active
                        ? activeBg
                        : 'bg-[#FBF9F3] border border-[#EEE5DA] text-[#8A8271] hover:bg-[#F2EEE2]'
                    }`}
                  >
                    <span className="text-xl">
                      {level === 1 && '😫'}
                      {level === 2 && '🥱'}
                      {level === 3 && '😐'}
                      {level === 4 && '🙂'}
                      {level === 5 && '😍'}
                    </span>
                    <span className="text-[11px] block">
                      {level === 1 && '힘듦'}
                      {level === 2 && '지침'}
                      {level === 3 && '보통'}
                      {level === 4 && '좋음'}
                      {level === 5 && '최고'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Mind Record (마음 기록): 오늘의 일기 / 잘한 일 / 잘못한 일 */}
      <div className="bg-white rounded-2xl border border-[rgba(42,39,35,.05)] shadow-[0_1px_2px_rgba(42,39,35,.04),0_10px_26px_rgba(42,39,35,.05)] p-5">
        <div className="flex gap-3 mb-4">
          <div className="p-3 bg-[#F4EEE0] text-[#B58A3C] rounded-xl border-none">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#2A2723]">마음 기록</h3>
            <p className="text-xs text-[#8A8271] mt-0.5">오늘 있었던 일이나 생각을 자유롭게 남겨보세요</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-[#8A8271] block mb-1.5">오늘의 일기</label>
            <textarea
              value={noteDiary}
              onChange={(e) => setNoteDiary(e.target.value)}
              onBlur={commitNote}
              placeholder="오늘의 일기"
              rows={3}
              className="w-full resize-none rounded-xl border border-[#EEE5DA] bg-[#FBF9F3] p-4 text-sm text-[#2A2723] placeholder:text-[#B8AF9C] focus:outline-none focus:ring-2 focus:ring-[#6F8F6A]/40"
              id="input-note-diary"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#8A8271] block mb-1.5">잘한 일</label>
            <textarea
              value={noteGood}
              onChange={(e) => setNoteGood(e.target.value)}
              onBlur={commitNote}
              placeholder="잘한 일"
              rows={2}
              className="w-full resize-none rounded-xl border border-[#EEE5DA] bg-[#FBF9F3] p-4 text-sm text-[#2A2723] placeholder:text-[#B8AF9C] focus:outline-none focus:ring-2 focus:ring-[#6F8F6A]/40"
              id="input-note-good"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#8A8271] block mb-1.5">잘못한 일</label>
            <textarea
              value={noteBad}
              onChange={(e) => setNoteBad(e.target.value)}
              onBlur={commitNote}
              placeholder="잘못한 일"
              rows={2}
              className="w-full resize-none rounded-xl border border-[#EEE5DA] bg-[#FBF9F3] p-4 text-sm text-[#2A2723] placeholder:text-[#B8AF9C] focus:outline-none focus:ring-2 focus:ring-[#6F8F6A]/40"
              id="input-note-bad"
            />
          </div>
        </div>
      </div>

      {/* --- BOTTOM SHEET MODALS --- */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            {/* Modal Backdrop click */}
            <div className="absolute inset-0" onClick={() => setActiveModal(null)} />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full md:max-w-md bg-[#F9F6EF] rounded-t-[26px] md:rounded-3xl shadow-2xl p-6 overflow-hidden z-10 max-h-[85vh] flex flex-col border border-[#E4DECF]"
            >
              {/* Drawer Handle for Mobile */}
              <div className="w-10 h-1 bg-[#DED7C8] rounded-full mx-auto mb-4 md:hidden" />

              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-lg text-[#2A2723] font-serif">
                  {activeModal === 'steps' && '걸음 수 입력'}
                  {activeModal === 'sleep' && '수면 상태 기록'}
                  {activeModal === 'meal' && '식단 추가 및 영양'}
                  {activeModal === 'mood' && '컨디션 상태 선택'}
                  {activeModal === 'weight' && '체중(kg) 기록'}
                  {activeModal === 'period' && '생리 세부정보 기록'}
                  {activeModal === 'goals' && '데일리 목표 설정'}
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-8.5 h-8.5 hover:bg-[#EEE9DD] rounded-full text-[#7C7669] flex items-center justify-center transition border-none cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="flex-1 overflow-y-auto pb-6 space-y-5">
                
                {/* 1. Modal Steps */}
                {activeModal === 'steps' && (
                  <div className="space-y-4">
                    <div className="text-center py-2">
                      <span className="text-[#8A8271] text-xs font-semibold block">현재 입력된 걸음</span>
                      <span className="text-4xl font-extrabold text-[#D08A2E] tracking-tight">
                        {(record.steps || 0).toLocaleString()}
                      </span>
                      <span className="text-[#8A8271] text-sm font-bold"> 보</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[500, 1000, 2000, 5000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => handleQuickSteps(amt)}
                          className="py-2.5 bg-[#FBF0DE] hover:bg-[#F3E3CD] text-[#D08A2E] text-xs font-bold rounded-xl border-none cursor-pointer transition"
                        >
                          +{amt.toLocaleString()}보 추가
                        </button>
                      ))}
                    </div>

                    <div className="pt-2">
                      <label className="text-xs text-[#8A8271] font-bold block mb-1.5">직접 값 입력 (걸음)</label>
                      <input
                        type="number"
                        placeholder="예: 8500"
                        value={record.steps || ''}
                        onChange={(e) => onUpdateRecord({ steps: Number(e.target.value) || null })}
                        className="w-full px-4 py-3 border border-[#E4DECF] bg-white rounded-xl focus:outline-none focus:border-[#D08A2E] text-base font-bold text-[#2A2723]"
                        id="input-steps-value"
                      />
                    </div>

                    <button
                      onClick={() => setActiveModal(null)}
                      className="w-full py-3.5 bg-[#D08A2E] hover:bg-[#B77A23] text-white font-bold rounded-xl text-sm border-none cursor-pointer transition"
                    >
                      기록 완료
                    </button>
                  </div>
                )}

                {/* 2. Modal Sleep */}
                {activeModal === 'sleep' && (
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-[#8A8271] font-bold">수면 시간 (시간)</label>
                        <span className="text-lg font-bold text-[#2A2723]">{record.sleepH || 0} 시간</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="12"
                        step="0.5"
                        value={record.sleepH || 0}
                        onChange={(e) => onUpdateRecord({ sleepH: Number(e.target.value) || null })}
                        className="w-full h-2 bg-[#EEE9DD] rounded-lg appearance-none cursor-pointer accent-[#6E63B6]"
                        id="input-sleep-hours"
                      />
                      <div className="flex justify-between text-[10px] text-[#8A8271] px-1 mt-1 font-mono">
                        <span>0시간</span>
                        <span>6시간</span>
                        <span>12시간</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-[#8A8271] font-bold block">수면 만족도</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <button
                            key={level}
                            onClick={() => onUpdateRecord({ sleepQ: level })}
                            className={`py-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                              record.sleepQ === level
                                ? 'border-[#6E63B6] bg-[#6E63B6] text-white'
                                : 'border-[#EEE5DA] bg-[#FBF9F3] hover:bg-[#F2EEE2] text-[#8A8271]'
                            }`}
                          >
                            <span className="text-lg">
                              {level === 1 && '😫'}
                              {level === 2 && '🥱'}
                              {level === 3 && '😐'}
                              {level === 4 && '🙂'}
                              {level === 5 && '😍'}
                            </span>
                            <span className="text-[10px] font-bold">
                              {level === 1 && '피곤'}
                              {level === 2 && '부족'}
                              {level === 3 && '보통'}
                              {level === 4 && '상쾌'}
                              {level === 5 && '최고'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveModal(null)}
                      className="w-full py-3.5 bg-[#6E63B6] hover:bg-[#5C52A3] text-white font-bold rounded-xl text-sm border-none cursor-pointer transition"
                    >
                      수면 기록 완료
                    </button>
                  </div>
                )}

                {/* 3. Modal Meal */}
                {activeModal === 'meal' && (
                  <div className="space-y-4">
                    {/* Add Meal Form */}
                    <form onSubmit={handleAddMeal} className="space-y-3 bg-[#FBF9F3] p-4 rounded-xl border border-[#EEE5DA]">
                      <span className="text-xs font-bold text-[#8A8271] block">새로운 식단 정보 추가</span>
                      
                      <div className="flex gap-1 bg-white p-1 rounded-lg border border-[#E4DECF]">
                        {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setMealType(type)}
                            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition border-none cursor-pointer ${
                              mealType === type
                                ? 'bg-[#C0663B] text-white shadow-sm'
                                : 'text-[#8A8271] hover:bg-[#FBF9F3]'
                            }`}
                          >
                            {type === 'breakfast' && '아침'}
                            {type === 'lunch' && '점심'}
                            {type === 'dinner' && '저녁'}
                            {type === 'snack' && '간식'}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="음식 이름 (예: 연어 샐러드)"
                            value={mealName}
                            onChange={(e) => setMealName(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E4DECF] bg-white rounded-lg focus:outline-none focus:border-[#C0663B] text-xs font-bold text-[#2A2723]"
                            id="input-meal-name"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="칼로리 (kcal)"
                            value={mealKcal}
                            onChange={(e) => setMealKcal(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E4DECF] bg-white rounded-lg focus:outline-none focus:border-[#C0663B] text-xs font-bold text-[#2A2723]"
                            id="input-meal-kcal"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="탄수화물 (g)"
                            value={mealCarbs}
                            onChange={(e) => setMealCarbs(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E4DECF] bg-white rounded-lg focus:outline-none focus:border-[#C0663B] text-xs font-bold text-[#2A2723]"
                            id="input-meal-carbs"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="단백질 (g)"
                            value={mealProtein}
                            onChange={(e) => setMealProtein(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E4DECF] bg-white rounded-lg focus:outline-none focus:border-[#C0663B] text-xs font-bold text-[#2A2723]"
                            id="input-meal-protein"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="지방 (g)"
                            value={mealFat}
                            onChange={(e) => setMealFat(e.target.value)}
                            className="w-full px-3 py-2 border border-[#E4DECF] bg-white rounded-lg focus:outline-none focus:border-[#C0663B] text-xs font-bold text-[#2A2723]"
                            id="input-meal-fat"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#C0663B] hover:bg-[#A3522C] text-white text-xs font-bold rounded-lg border-none cursor-pointer transition flex justify-center items-center gap-1"
                        id="btn-meal-save"
                      >
                        <Plus className="w-4 h-4" /> 식단에 추가
                      </button>
                    </form>

                    {/* Meal Items List */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#8A8271] block font-mono uppercase tracking-wider">오늘 먹은 식사 목록 ({record.meals.length})</span>
                      {record.meals.length > 0 ? (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {record.meals.map((meal) => (
                            <div
                              key={meal.id}
                              className="bg-white border border-[#E4DECF] rounded-xl p-3 flex justify-between items-center"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 bg-[#F7EAE1] text-[#C0663B] rounded text-[10px] font-extrabold uppercase">
                                    {meal.type === 'breakfast' && '아침'}
                                    {meal.type === 'lunch' && '점심'}
                                    {meal.type === 'dinner' && '저녁'}
                                    {meal.type === 'snack' && '간식'}
                                  </span>
                                  <h4 className="font-bold text-xs text-[#2A2723]">{meal.name}</h4>
                                </div>
                                <p className="text-[10px] text-[#8A8271] mt-1 font-mono">
                                  탄 {meal.carbs}g · 단 {meal.protein}g · 지 {meal.fat}g
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-[#C0663B]">{meal.kcal} kcal</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMeal(meal.id)}
                                  className="p-1 hover:bg-[#F2EEE2] text-[#C4BCAC] hover:text-[#C25E7A] rounded transition border-none cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#8A8271] py-3.5 text-center bg-white border border-[#E4DECF] rounded-xl font-medium">오늘 추가된 식사가 없습니다.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Modal Mood */}
                {activeModal === 'mood' && (
                  <div className="space-y-4 pt-2">
                    <span className="text-xs text-[#8A8271] font-bold block text-center mb-1">
                      오늘의 감정과 몸 상태를 가장 잘 표현하는 컨디션을 선택해 주세요.
                    </span>
                    <div className="space-y-2">
                      {[
                        { val: 5, label: '최고의 컨디션이에요 😍', desc: '의욕이 넘치고 건강한 상태', bg: 'border-[#6F8F6A] bg-[#6F8F6A] text-white', color: '#6F8F6A' },
                        { val: 4, label: '좋은 하루예요 🙂', desc: '평온하고 기분 좋은 상태', bg: 'border-[#8FA36A] bg-[#8FA36A] text-white', color: '#8FA36A' },
                        { val: 3, label: '보통이에요 😐', desc: '그럭저럭 지낼 만한 상태', bg: 'border-[#C4B268] bg-[#C4B268] text-white', color: '#C4B268' },
                        { val: 2, label: '조금 지쳐요 🥱', desc: '체력이나 활력이 떨어지는 상태', bg: 'border-[#D69A55] bg-[#D69A55] text-white', color: '#D69A55' },
                        { val: 1, label: '힘든 하루예요 😫', desc: '스트레스나 통증이 있는 상태', bg: 'border-[#C97C6B] bg-[#C97C6B] text-white', color: '#C97C6B' },
                      ].map((item) => {
                        const active = record.mood === item.val;
                        return (
                          <button
                            key={item.val}
                            onClick={() => handleMoodSelect(item.val)}
                            className={`w-full p-4 border rounded-xl text-left flex justify-between items-center transition cursor-pointer ${
                              active
                                ? item.bg
                                : 'border-[#EEE5DA] bg-[#FBF9F3] hover:bg-[#F2EEE2] text-[#2A2723]'
                            }`}
                          >
                            <div>
                              <span className="text-xs font-bold block">{item.label}</span>
                              <span className={`text-[10px] block mt-0.5 ${active ? 'text-white/80' : 'text-[#8A8271]'}`}>{item.desc}</span>
                            </div>
                            {active && (
                              <div className="p-1 bg-white text-black rounded-full">
                                <Check className="w-3.5 h-3.5" style={{ color: item.color }} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. Modal Weight */}
                {activeModal === 'weight' && (
                  <div className="space-y-4">
                    <div className="text-center py-2">
                      <span className="text-[#8A8271] text-xs font-semibold block">오늘 측정 체중</span>
                      <div className="flex justify-center items-baseline gap-1 mt-1">
                        <span className="text-4xl font-extrabold text-[#2A2723] tracking-tight">
                          {record.weight || '55.0'}
                        </span>
                        <span className="text-[#8A8271] text-base font-bold">kg</span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 justify-center">
                      {[-0.5, -0.1, 0.1, 0.5].map((val) => (
                        <button
                          key={val}
                          onClick={() => handleQuickWeight(val)}
                          className="px-4 py-2 bg-[#FBF9F3] border border-[#E4DECF] hover:bg-[#F2EEE2] text-[#2A2723] text-xs font-bold rounded-lg transition cursor-pointer"
                        >
                          {val > 0 ? `+${val}` : val} kg
                        </button>
                      ))}
                    </div>

                    <div className="pt-2">
                      <label className="text-xs text-[#8A8271] font-bold block mb-1.5">직접 체중값 입력</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="예: 54.8"
                        value={record.weight || ''}
                        onChange={(e) => onUpdateRecord({ weight: Number(e.target.value) || null })}
                        className="w-full px-4 py-3 border border-[#E4DECF] bg-white rounded-xl focus:outline-none focus:border-[#4E6B4A] text-base font-bold text-[#2A2723]"
                        id="input-weight-value"
                      />
                    </div>

                    <button
                      onClick={() => setActiveModal(null)}
                      className="w-full py-3.5 bg-[#4E6B4A] hover:bg-[#40583C] text-white font-bold rounded-xl text-sm border-none cursor-pointer transition"
                    >
                      체중 기록 완료
                    </button>
                  </div>
                )}

                {/* 6. Modal Period */}
                {activeModal === 'period' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3.5 bg-[#FBF9F3] border border-[#E4DECF] rounded-xl">
                      <div>
                        <span className="text-xs font-bold text-[#8A8271] block">오늘 생리 기록</span>
                        <span className="text-sm font-semibold text-[#2A2723]">오늘 생리 중이신가요?</span>
                      </div>
                      <button
                        onClick={handlePeriodToggle}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl transition border-none cursor-pointer ${
                          record.period?.active
                            ? 'bg-[#C25E7A] text-white'
                            : 'bg-white border border-[#E4DECF] text-[#2A2723] hover:bg-[#F2EEE2]'
                        }`}
                        id="btn-period-toggle-inside"
                      >
                        {record.period?.active ? '생리 진행중' : '기록하지 않음'}
                      </button>
                    </div>

                    {record.period?.active && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        {/* Flow Selection */}
                        <div className="space-y-2">
                          <label className="text-xs text-[#8A8271] font-bold block">오늘 생리 양</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['light', 'medium', 'heavy'] as const).map((flow) => (
                              <button
                                key={flow}
                                onClick={() => updatePeriodFlow(flow)}
                                className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                                  record.period?.flow === flow
                                    ? 'border-[#C25E7A] bg-[#F8E7EC] text-[#C25E7A]'
                                    : 'border-[#EEE5DA] bg-[#FBF9F3] text-[#8A8271]'
                                }`}
                              >
                                {flow === 'light' && '적음 (Light)'}
                                {flow === 'medium' && '보통 (Medium)'}
                                {flow === 'heavy' && '많음 (Heavy)'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Symptoms selection */}
                        <div className="space-y-2">
                          <label className="text-xs text-[#8A8271] font-bold block">동반 증상 (다중 선택)</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              '복통',
                              '두통',
                              '피로',
                              '붓기',
                              '예민함',
                              '요통',
                              '어지러움',
                              '메스꺼움',
                            ].map((symptom) => {
                              const selected = !!record.period?.symptoms.includes(symptom);
                              return (
                                <button
                                  key={symptom}
                                  onClick={() => togglePeriodSymptom(symptom)}
                                  className={`py-2 text-xs font-medium rounded-xl border flex items-center justify-center gap-1 transition cursor-pointer ${
                                    selected
                                      ? 'border-[#C25E7A] bg-[#F8E7EC] text-[#C25E7A] font-bold'
                                      : 'border-[#EEE5DA] bg-[#FBF9F3] text-[#8A8271]'
                                  }`}
                                >
                                  {selected && <Check className="w-3.5 h-3.5" />}
                                  {symptom}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <button
                      onClick={() => setActiveModal(null)}
                      className="w-full py-3.5 bg-[#C25E7A] hover:bg-[#A94A64] text-white font-bold rounded-xl text-sm border-none cursor-pointer transition"
                    >
                      생리 상태 저장
                    </button>
                  </div>
                )}

                {/* 7. Modal Goals */}
                {activeModal === 'goals' && (
                  <div className="space-y-4">
                    <span className="text-xs text-[#8A8271] font-bold block">매일 달성하고자 하는 권장 목표 값을 설정하세요</span>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] text-[#8A8271] font-bold block mb-1">하루 수분 섭취 목표 (잔, 1잔=250ml)</label>
                        <input
                          type="number"
                          value={goalWater}
                          onChange={(e) => setGoalWater(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-[#E4DECF] bg-white rounded-xl font-bold text-xs text-[#2A2723]"
                          id="setup-goal-water"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-[#8A8271] font-bold block mb-1">하루 걸음 수 목표 (걸음)</label>
                        <input
                          type="number"
                          value={goalSteps}
                          onChange={(e) => setGoalSteps(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-[#E4DECF] bg-white rounded-xl font-bold text-xs text-[#2A2723]"
                          id="setup-goal-steps"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-[#8A8271] font-bold block mb-1">희망 수면 시간 (시간)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={goalSleep}
                          onChange={(e) => setGoalSleep(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-[#E4DECF] bg-white rounded-xl font-bold text-xs text-[#2A2723]"
                          id="setup-goal-sleep"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-[#8A8271] font-bold block mb-1">하루 칼로리 섭취 목표 (kcal)</label>
                        <input
                          type="number"
                          value={goalKcal}
                          onChange={(e) => setGoalKcal(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-[#E4DECF] bg-white rounded-xl font-bold text-xs text-[#2A2723]"
                          id="setup-goal-kcal"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveGoals}
                      className="w-full py-3.5 bg-[#6F8F6A] hover:bg-[#5E7A59] text-white font-bold rounded-xl text-sm border-none cursor-pointer transition"
                    >
                      목표치 저장하기
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

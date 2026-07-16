import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  X,
  Droplet,
  Footprints,
  Moon,
  Utensils,
  Scale,
  Smile,
  Heart,
  Pencil,
  Plus,
  Check
} from 'lucide-react';
import { DailyRecord, Meal, MealType, PeriodData, UserGoals } from '../types';
import { predictPeriod, formatDate, parseDate, addDays, getDaysDiff } from '../utils/period';

function hasNoteContent(note: DailyRecord['note']): boolean {
  return !!(note && (note.diary?.trim() || note.good?.trim() || note.bad?.trim()));
}

interface CalendarTabProps {
  allRecords: DailyRecord[];
  goals: UserGoals;
  todayStr: string;
  onUpdateRecord: (dateStr: string, updated: Partial<DailyRecord>) => void;
}

const PERIOD_SYMPTOMS = ['복통', '두통', '피로', '붓기', '예민함', '요통', '어지러움', '메스꺼움'];

export default function CalendarTab({ allRecords, goals, todayStr, onUpdateRecord }: CalendarTabProps) {
  const [viewDate, setViewDate] = useState<Date>(new Date(todayStr));
  const [selectedRecord, setSelectedRecord] = useState<DailyRecord | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // --- Edit form state ---
  const [editWater, setEditWater] = useState(0);
  const [editSteps, setEditSteps] = useState<number | null>(null);
  const [editSleepH, setEditSleepH] = useState<number | null>(null);
  const [editSleepQ, setEditSleepQ] = useState<number | null>(null);
  const [editWeight, setEditWeight] = useState<number | null>(null);
  const [editMood, setEditMood] = useState<number | null>(null);
  const [editPeriod, setEditPeriod] = useState<PeriodData | null>(null);
  const [editMeals, setEditMeals] = useState<Meal[]>([]);
  const [editNoteDiary, setEditNoteDiary] = useState('');
  const [editNoteGood, setEditNoteGood] = useState('');
  const [editNoteBad, setEditNoteBad] = useState('');

  // --- New meal sub-form (inside edit mode) ---
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [mealName, setMealName] = useState('');
  const [mealKcal, setMealKcal] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealFat, setMealFat] = useState('');

  const closeSheet = () => {
    setSelectedDateStr(null);
    setSelectedRecord(null);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    if (!selectedRecord) return;
    setEditWater(selectedRecord.water);
    setEditSteps(selectedRecord.steps);
    setEditSleepH(selectedRecord.sleepH);
    setEditSleepQ(selectedRecord.sleepQ);
    setEditWeight(selectedRecord.weight);
    setEditMood(selectedRecord.mood);
    setEditPeriod(selectedRecord.period);
    setEditMeals(selectedRecord.meals);
    setEditNoteDiary(selectedRecord.note?.diary ?? '');
    setEditNoteGood(selectedRecord.note?.good ?? '');
    setEditNoteBad(selectedRecord.note?.bad ?? '');
    setMealType('breakfast');
    setMealName('');
    setMealKcal('');
    setMealCarbs('');
    setMealProtein('');
    setMealFat('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (!selectedDateStr || !selectedRecord) return;

    const trimmedDiary = editNoteDiary.trim();
    const trimmedGood = editNoteGood.trim();
    const trimmedBad = editNoteBad.trim();
    const nextNote = trimmedDiary || trimmedGood || trimmedBad
      ? {
          diary: trimmedDiary ? editNoteDiary : null,
          good: trimmedGood ? editNoteGood : null,
          bad: trimmedBad ? editNoteBad : null,
        }
      : null;

    const updatedFields: Partial<DailyRecord> = {
      water: editWater,
      steps: editSteps,
      sleepH: editSleepH,
      sleepQ: editSleepQ,
      weight: editWeight,
      mood: editMood,
      period: editPeriod,
      meals: editMeals,
      note: nextNote,
    };

    onUpdateRecord(selectedDateStr, updatedFields);
    setSelectedRecord({ ...selectedRecord, ...updatedFields });
    setIsEditing(false);
  };

  const handleAddEditMeal = (e: React.FormEvent) => {
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

    setEditMeals((prev) => [...prev, newMeal]);
    setMealName('');
    setMealKcal('');
    setMealCarbs('');
    setMealProtein('');
    setMealFat('');
  };

  const handleRemoveEditMeal = (id: string) => {
    setEditMeals((prev) => prev.filter((m) => m.id !== id));
  };

  const handleEditPeriodToggle = () => {
    const wasActive = !!(editPeriod && editPeriod.active);
    setEditPeriod(wasActive ? null : { active: true, flow: 'medium', symptoms: [] });
  };

  const updateEditPeriodFlow = (flow: 'light' | 'medium' | 'heavy') => {
    const cur = editPeriod || { active: true, flow: null, symptoms: [] };
    setEditPeriod({ ...cur, active: true, flow });
  };

  const toggleEditPeriodSymptom = (symptom: string) => {
    const cur = editPeriod || { active: true, flow: null, symptoms: [] };
    const symptoms = cur.symptoms.includes(symptom)
      ? cur.symptoms.filter((s) => s !== symptom)
      : [...cur.symptoms, symptom];
    setEditPeriod({ ...cur, active: true, symptoms });
  };

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); // 0-11

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // --- Calendar Generation ---
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Days from previous month to fill the first row
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const prevMonthCells = Array.from({ length: firstDayOfMonth }).map((_, i) => {
    const day = prevMonthDays - firstDayOfMonth + 1 + i;
    const date = new Date(currentYear, currentMonth - 1, day);
    return { day, date, isCurrentMonth: false };
  });

  // Days of current month
  const currentMonthCells = Array.from({ length: daysInMonth }).map((_, i) => {
    const day = i + 1;
    const date = new Date(currentYear, currentMonth, day);
    return { day, date, isCurrentMonth: true };
  });

  // Days of next month to fill the remaining slots to complete rows of 7
  const totalCellsSoFar = prevMonthCells.length + currentMonthCells.length;
  const remainingCellsNeeded = totalCellsSoFar % 7 === 0 ? 0 : 7 - (totalCellsSoFar % 7);
  const nextMonthCells = Array.from({ length: remainingCellsNeeded }).map((_, i) => {
    const day = i + 1;
    const date = new Date(currentYear, currentMonth + 1, day);
    return { day, date, isCurrentMonth: false };
  });

  const calendarCells = [...prevMonthCells, ...currentMonthCells, ...nextMonthCells];

  // --- Period predictions analysis ---
  const prediction = predictPeriod(allRecords, todayStr);

  // Helper to check if a specific date is a predicted period day
  // (from prediction.nextPredictedDate to nextPredictedDate + averageLength)
  const isDatePredictedPeriod = (dateStr: string): boolean => {
    if (!prediction.nextPredictedDate || !prediction.averageLength) return false;

    const startProj = prediction.nextPredictedDate;
    const lengthProj = Math.round(prediction.averageLength);
    const endProj = addDays(startProj, lengthProj - 1);

    return dateStr >= startProj && dateStr <= endProj;
  };

  // Handle day click
  const handleDayClick = (cellDate: Date) => {
    const cellDateStr = formatDate(cellDate);
    const matchedRecord = allRecords.find((r) => r.date === cellDateStr);

    setIsEditing(false);
    setSelectedDateStr(cellDateStr);
    if (matchedRecord) {
      setSelectedRecord(matchedRecord);
    } else {
      // Create empty record representation for view
      setSelectedRecord({
        date: cellDateStr,
        meals: [],
        water: 0,
        steps: null,
        sleepH: null,
        sleepQ: null,
        weight: null,
        mood: null,
        period: null,
        note: null,
      });
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#8A8271] uppercase font-mono">CALENDAR</p>
          <h1 className="text-2xl font-bold tracking-tight text-[#2A2723] font-serif mt-0.5">건강 달력</h1>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex items-center gap-1.5 bg-[#FBF9F3] p-1.5 rounded-xl border border-[#E4DECF] shadow-xs">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 hover:bg-[#F2EEE2] text-[#2A2723] rounded-lg transition border-none cursor-pointer flex items-center justify-center"
            id="btn-calendar-prev"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-[#2A2723] px-2 font-serif">
            {currentYear}년 {currentMonth + 1}월
          </span>
          <button
            onClick={handleNextMonth}
            className="w-8 h-8 hover:bg-[#F2EEE2] text-[#2A2723] rounded-lg transition border-none cursor-pointer flex items-center justify-center"
            id="btn-calendar-next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-[#FBF9F3] rounded-2xl p-4.5 border border-[#E4DECF] shadow-xs">
        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center mb-3 text-xs font-bold text-[#8A8271]">
          <div className="text-[#C25E7A] py-1">일</div>
          <div className="py-1">월</div>
          <div className="py-1">화</div>
          <div className="py-1">수</div>
          <div className="py-1">목</div>
          <div className="py-1">금</div>
          <div className="text-[#4E6B4A] py-1">토</div>
        </div>

        {/* Month grid cells */}
        <div className="grid grid-cols-7 gap-2" id="calendar-grid">
          {calendarCells.map((cell, idx) => {
            const cellDateStr = formatDate(cell.date);
            const isToday = cellDateStr === todayStr;
            const matchedRecord = allRecords.find((r) => r.date === cellDateStr);

            // Period checks
            const isActivePeriod = !!(matchedRecord && matchedRecord.period && matchedRecord.period.active);
            const isPredicted = isDatePredictedPeriod(cellDateStr);

            // Record dots checklist with beautiful category-aligned colors
            const dots = [];
            if (matchedRecord) {
              if (matchedRecord.water > 0) dots.push({ color: 'bg-[#799FCB]', label: '수분' });
              if (matchedRecord.steps && matchedRecord.steps > 0) dots.push({ color: 'bg-[#D08A2E]', label: '걸음' });
              if (matchedRecord.sleepH && matchedRecord.sleepH > 0) dots.push({ color: 'bg-[#6E63B6]', label: '수면' });
              if (matchedRecord.meals.length > 0) dots.push({ color: 'bg-[#C0663B]', label: '식사' });
              if (matchedRecord.weight && matchedRecord.weight > 0) dots.push({ color: 'bg-[#4E6B4A]', label: '체중' });
              if (hasNoteContent(matchedRecord.note)) dots.push({ color: 'bg-[#B58A3C]', label: '마음 기록' });
            }

            // Cell Styles
            let cellClass = 'relative min-h-[76px] p-2 bg-white border border-[#E4DECF]/50 rounded-xl transition flex flex-col justify-between cursor-pointer hover:bg-[#F5F2EA]';
            if (!cell.isCurrentMonth) {
              cellClass += ' opacity-35';
            }
            if (isToday) {
              cellClass += ' ring-2 ring-[#6F8F6A] ring-offset-2 ring-offset-[#F5F2EA]';
            }
            if (isActivePeriod) {
              cellClass += ' bg-[#C25E7A] text-white border-[#C25E7A] hover:bg-[#A94A64]';
            } else if (isPredicted) {
              cellClass += ' bg-[#FBF0DE] border-dashed border-[#D08A2E] hover:bg-[#F3E3CD] text-[#D08A2E]';
            }

            return (
              <div
                key={cellDateStr + idx}
                onClick={() => handleDayClick(cell.date)}
                className={cellClass}
              >
                {/* Upper row: Date number + indicator */}
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-bold ${isActivePeriod ? 'text-white' : 'text-[#2A2723]'}`}>
                    {cell.day}
                  </span>
                  
                  {isActivePeriod && (
                    <Heart className="w-3 h-3 fill-white text-white" />
                  )}
                  {isPredicted && !isActivePeriod && (
                    <span className="text-[7px] bg-white px-1 py-0.5 border border-[#D08A2E] text-[#D08A2E] font-bold rounded">예정</span>
                  )}
                </div>

                {/* Lower row: Activity dots */}
                <div className="flex flex-wrap gap-1 mt-auto h-2 max-w-full">
                  {!isActivePeriod && !isPredicted && dots.map((dot, dIdx) => (
                    <div
                      key={dIdx}
                      className={`w-1.5 h-1.5 rounded-full ${dot.color}`}
                      title={dot.label}
                    />
                  ))}
                  {(isActivePeriod || isPredicted) && dots.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/80" title="건강 기록 존재" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Predictions and Legend Panel */}
      <div className="bg-[#FBF9F3] rounded-2xl p-5 border border-[#E4DECF] space-y-4">
        <h3 className="font-bold text-sm text-[#2A2723] font-serif flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#6F8F6A]" />
          주기 예측 및 범례
        </h3>

        {/* Prediction summary cards */}
        {prediction.nextPredictedDate ? (
          <div className="p-3.5 bg-[#F5F2EA]/80 border border-[#E4DECF] rounded-xl flex items-center justify-between text-xs shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[#8A8271] font-semibold">다음 예상 생리 주기 시작일</span>
              <p className="font-bold text-[#2A2723]">{prediction.nextPredictedDate} ({prediction.averageCycle}일 주기)</p>
            </div>
            {prediction.dDay !== null && (
              <span className="px-3.5 py-1.5 bg-[#C25E7A] text-white font-extrabold rounded-lg text-[10px] tracking-wider">
                {prediction.dDay < 0 ? `D+${Math.abs(prediction.dDay)}` : `D-${prediction.dDay}`}
              </span>
            )}
          </div>
        ) : (
          <div className="p-4 bg-[#F5F2EA]/80 border border-[#E4DECF] rounded-xl text-xs flex gap-2.5 items-start text-[#8A8271]">
            <Info className="w-4 h-4 text-[#8A8271] flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">달력의 날짜를 누르고 생리 기록을 남겨보세요! 기록이 쌓이면 사용자의 고유한 신체 주기를 분석하여 다음 주기 예정일을 똑똑하게 예측해 줍니다.</p>
          </div>
        )}

        {/* Legends */}
        <div className="pt-2 border-t border-[#E4DECF]/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-[#8A8271] font-bold">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#799FCB]" />
            <span>수분 섭취</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D08A2E]" />
            <span>걸음 수</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#6E63B6]" />
            <span>수면 상태</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#C0663B]" />
            <span>식단 로그</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#4E6B4A]" />
            <span>체중 측정</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#B58A3C]" />
            <span>마음 기록</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-md bg-[#C25E7A]" />
            <span>생리 기록일</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <div className="w-2.5 h-2.5 rounded-md border border-dashed border-[#D08A2E] bg-[#FBF0DE]" />
            <span>생리 예정일 (AI 예측)</span>
          </div>
        </div>
      </div>

      {/* --- DAY DETAILS BOTTOM SHEET --- */}
      <AnimatePresence>
        {selectedDateStr && selectedRecord && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0" onClick={closeSheet} />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full md:max-w-md bg-[#F9F6EF] rounded-t-[26px] md:rounded-3xl shadow-2xl p-6 overflow-hidden z-10 max-h-[80vh] flex flex-col border border-[#E4DECF]"
            >
              <div className="w-10 h-1 bg-[#DED7C8] rounded-full mx-auto mb-4 md:hidden" />

              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="font-bold text-lg text-[#2A2723] font-serif">
                    {isEditing ? '기록 수정하기' : '기록 상세 보기'}
                  </h3>
                  <p className="text-xs text-[#8A8271] mt-0.5 font-mono">{selectedDateStr}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <button
                      onClick={handleStartEdit}
                      className="px-3 py-2 bg-[#6F8F6A] hover:bg-[#5E7A59] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition border-none cursor-pointer"
                      id="btn-record-edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      수정
                    </button>
                  )}
                  <button
                    onClick={closeSheet}
                    className="w-8.5 h-8.5 hover:bg-[#EEE9DD] rounded-full text-[#7C7669] flex items-center justify-center transition border-none cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable logs */}
              <div className="flex-1 overflow-y-auto space-y-4 pb-6">
                {isEditing ? (
                <div className="space-y-4">
                  {/* Water */}
                  <div className="p-3.5 bg-white rounded-xl border border-[#E4DECF] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2A2723] flex items-center gap-1.5">
                        <Droplet className="w-4 h-4 text-[#799FCB]" />
                        수분 섭취량 (잔)
                      </span>
                      <span className="text-xs font-bold text-[#2A2723]">{editWater}잔 ({editWater * 250}ml)</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditWater((v) => Math.max(0, v - 1))}
                        className="flex-1 py-2 bg-[#FBF9F3] border border-[#E4DECF] hover:bg-[#F2EEE2] text-[#7C7669] rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        - 한 잔
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditWater((v) => v + 1)}
                        className="flex-1 py-2 bg-[#799FCB] hover:bg-[#6889B8] text-white rounded-lg text-xs font-bold transition border-none cursor-pointer"
                      >
                        + 한 잔
                      </button>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="p-3.5 bg-white rounded-xl border border-[#E4DECF] space-y-2">
                    <span className="text-xs font-bold text-[#2A2723] flex items-center gap-1.5">
                      <Footprints className="w-4 h-4 text-[#D08A2E]" />
                      걸음 수
                    </span>
                    <input
                      type="number"
                      placeholder="예: 8500"
                      value={editSteps ?? ''}
                      onChange={(e) => setEditSteps(e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#E4DECF] bg-[#FBF9F3] rounded-lg focus:outline-none focus:border-[#D08A2E] text-xs font-bold text-[#2A2723]"
                      id="edit-steps-value"
                    />
                  </div>

                  {/* Sleep */}
                  <div className="p-3.5 bg-white rounded-xl border border-[#E4DECF] space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#2A2723] flex items-center gap-1.5">
                        <Moon className="w-4 h-4 text-[#6E63B6]" />
                        수면 시간
                      </span>
                      <span className="text-xs font-bold text-[#2A2723]">{editSleepH || 0} 시간</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      step="0.5"
                      value={editSleepH || 0}
                      onChange={(e) => setEditSleepH(Number(e.target.value) || null)}
                      className="w-full h-2 bg-[#EEE9DD] rounded-lg appearance-none cursor-pointer accent-[#6E63B6]"
                      id="edit-sleep-hours"
                    />
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setEditSleepQ(level)}
                          className={`py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${
                            editSleepQ === level
                              ? 'border-[#6E63B6] bg-[#6E63B6] text-white'
                              : 'border-[#EEE5DA] bg-[#FBF9F3] hover:bg-[#F2EEE2] text-[#8A8271]'
                          }`}
                        >
                          {level === 1 && '😫'}
                          {level === 2 && '🥱'}
                          {level === 3 && '😐'}
                          {level === 4 && '🙂'}
                          {level === 5 && '😍'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weight */}
                  <div className="p-3.5 bg-white rounded-xl border border-[#E4DECF] space-y-2">
                    <span className="text-xs font-bold text-[#2A2723] flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-[#4E6B4A]" />
                      체중 (kg)
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="예: 54.8"
                      value={editWeight ?? ''}
                      onChange={(e) => setEditWeight(e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#E4DECF] bg-[#FBF9F3] rounded-lg focus:outline-none focus:border-[#4E6B4A] text-xs font-bold text-[#2A2723]"
                      id="edit-weight-value"
                    />
                  </div>

                  {/* Mood */}
                  <div className="p-3.5 bg-white rounded-xl border border-[#E4DECF] space-y-2">
                    <span className="text-xs font-bold text-[#2A2723] flex items-center gap-1.5">
                      <Smile className="w-4 h-4 text-[#D69A55]" />
                      오늘의 기분
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setEditMood(level)}
                          className={`py-2.5 rounded-lg border text-lg transition cursor-pointer ${
                            editMood === level
                              ? 'border-[#B58A3C] bg-[#B58A3C]'
                              : 'border-[#EEE5DA] bg-[#FBF9F3] hover:bg-[#F2EEE2]'
                          }`}
                        >
                          {level === 1 && '😫'}
                          {level === 2 && '🥱'}
                          {level === 3 && '😐'}
                          {level === 4 && '🙂'}
                          {level === 5 && '😍'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Period */}
                  <div className="p-3.5 bg-white rounded-xl border border-[#E4DECF] space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#2A2723] flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-[#C25E7A]" />
                        생리 기록
                      </span>
                      <button
                        type="button"
                        onClick={handleEditPeriodToggle}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition border-none cursor-pointer ${
                          editPeriod?.active
                            ? 'bg-[#C25E7A] text-white'
                            : 'bg-[#FBF9F3] border border-[#E4DECF] text-[#2A2723] hover:bg-[#F2EEE2]'
                        }`}
                      >
                        {editPeriod?.active ? '생리 중' : '기록 없음'}
                      </button>
                    </div>

                    {editPeriod?.active && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {(['light', 'medium', 'heavy'] as const).map((flow) => (
                            <button
                              key={flow}
                              type="button"
                              onClick={() => updateEditPeriodFlow(flow)}
                              className={`py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                                editPeriod?.flow === flow
                                  ? 'border-[#C25E7A] bg-[#F8E7EC] text-[#C25E7A]'
                                  : 'border-[#EEE5DA] bg-[#FBF9F3] text-[#8A8271]'
                              }`}
                            >
                              {flow === 'light' && '적음'}
                              {flow === 'medium' && '보통'}
                              {flow === 'heavy' && '많음'}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {PERIOD_SYMPTOMS.map((symptom) => {
                            const selected = !!editPeriod?.symptoms.includes(symptom);
                            return (
                              <button
                                key={symptom}
                                type="button"
                                onClick={() => toggleEditPeriodSymptom(symptom)}
                                className={`py-1.5 text-xs font-medium rounded-lg border flex items-center justify-center gap-1 transition cursor-pointer ${
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
                    )}
                  </div>

                  {/* Meals */}
                  <div className="p-3.5 bg-white rounded-xl border border-[#E4DECF] space-y-3">
                    <span className="text-xs font-bold text-[#2A2723] flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-[#C0663B]" />
                      섭취 식단 내역 ({editMeals.length})
                    </span>

                    <form onSubmit={handleAddEditMeal} className="space-y-2.5 bg-[#FBF9F3] p-3 rounded-lg border border-[#EEE5DA]">
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
                            id="edit-meal-name"
                          />
                        </div>
                        <input
                          type="number"
                          placeholder="칼로리 (kcal)"
                          value={mealKcal}
                          onChange={(e) => setMealKcal(e.target.value)}
                          className="w-full px-3 py-2 border border-[#E4DECF] bg-white rounded-lg focus:outline-none focus:border-[#C0663B] text-xs font-bold text-[#2A2723]"
                          id="edit-meal-kcal"
                        />
                        <input
                          type="number"
                          placeholder="탄수화물 (g)"
                          value={mealCarbs}
                          onChange={(e) => setMealCarbs(e.target.value)}
                          className="w-full px-3 py-2 border border-[#E4DECF] bg-white rounded-lg focus:outline-none focus:border-[#C0663B] text-xs font-bold text-[#2A2723]"
                          id="edit-meal-carbs"
                        />
                        <input
                          type="number"
                          placeholder="단백질 (g)"
                          value={mealProtein}
                          onChange={(e) => setMealProtein(e.target.value)}
                          className="w-full px-3 py-2 border border-[#E4DECF] bg-white rounded-lg focus:outline-none focus:border-[#C0663B] text-xs font-bold text-[#2A2723]"
                          id="edit-meal-protein"
                        />
                        <input
                          type="number"
                          placeholder="지방 (g)"
                          value={mealFat}
                          onChange={(e) => setMealFat(e.target.value)}
                          className="w-full px-3 py-2 border border-[#E4DECF] bg-white rounded-lg focus:outline-none focus:border-[#C0663B] text-xs font-bold text-[#2A2723]"
                          id="edit-meal-fat"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-[#C0663B] hover:bg-[#A3522C] text-white text-xs font-bold rounded-lg border-none cursor-pointer transition flex justify-center items-center gap-1"
                        id="btn-edit-meal-save"
                      >
                        <Plus className="w-4 h-4" /> 식단에 추가
                      </button>
                    </form>

                    {editMeals.length > 0 && (
                      <div className="space-y-1.5">
                        {editMeals.map((meal) => (
                          <div key={meal.id} className="bg-[#FBF9F3] p-2.5 rounded-lg border border-[#E4DECF]/60 flex justify-between items-center text-xs">
                            <div>
                              <span className="px-1.5 py-0.5 bg-[#F7EAE1] text-[#C0663B] rounded text-[9px] font-extrabold uppercase mr-1.5">
                                {meal.type === 'breakfast' && '아침'}
                                {meal.type === 'lunch' && '점심'}
                                {meal.type === 'dinner' && '저녁'}
                                {meal.type === 'snack' && '간식'}
                              </span>
                              <span className="font-bold text-[#2A2723]">{meal.name}</span>
                              <span className="font-bold text-[#C0663B] ml-1.5">{meal.kcal}kcal</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveEditMeal(meal.id)}
                              className="p-1 hover:bg-[#F2EEE2] text-[#C4BCAC] hover:text-[#C25E7A] rounded transition border-none cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mind record */}
                  <div className="p-3.5 bg-white rounded-xl border border-[#E4DECF] space-y-3">
                    <span className="text-xs font-bold text-[#2A2723] flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-[#B58A3C]" />
                      마음 기록
                    </span>
                    <div>
                      <label className="text-[10px] font-bold text-[#8A8271] block mb-1">오늘의 일기</label>
                      <textarea
                        value={editNoteDiary}
                        onChange={(e) => setEditNoteDiary(e.target.value)}
                        rows={3}
                        placeholder="오늘의 일기"
                        className="w-full resize-none rounded-lg border border-[#EEE5DA] bg-[#FBF9F3] p-3 text-xs text-[#2A2723] placeholder:text-[#B8AF9C] focus:outline-none focus:ring-2 focus:ring-[#6F8F6A]/40"
                        id="edit-note-diary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8A8271] block mb-1">잘한 일</label>
                      <textarea
                        value={editNoteGood}
                        onChange={(e) => setEditNoteGood(e.target.value)}
                        rows={2}
                        placeholder="잘한 일"
                        className="w-full resize-none rounded-lg border border-[#EEE5DA] bg-[#FBF9F3] p-3 text-xs text-[#2A2723] placeholder:text-[#B8AF9C] focus:outline-none focus:ring-2 focus:ring-[#6F8F6A]/40"
                        id="edit-note-good"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8A8271] block mb-1">잘못한 일</label>
                      <textarea
                        value={editNoteBad}
                        onChange={(e) => setEditNoteBad(e.target.value)}
                        rows={2}
                        placeholder="잘못한 일"
                        className="w-full resize-none rounded-lg border border-[#EEE5DA] bg-[#FBF9F3] p-3 text-xs text-[#2A2723] placeholder:text-[#B8AF9C] focus:outline-none focus:ring-2 focus:ring-[#6F8F6A]/40"
                        id="edit-note-bad"
                      />
                    </div>
                  </div>

                  {/* Save / Cancel */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 py-3 bg-[#FBF9F3] border border-[#E4DECF] hover:bg-[#F2EEE2] text-[#2A2723] rounded-xl text-sm font-bold transition cursor-pointer"
                      id="btn-record-edit-cancel"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="flex-1 py-3 bg-[#6F8F6A] hover:bg-[#5E7A59] text-white rounded-xl text-sm font-bold transition border-none cursor-pointer"
                      id="btn-record-edit-save"
                    >
                      저장하기
                    </button>
                  </div>
                </div>
                ) : (
                <>
                {/* Check if absolutely empty */}
                {selectedRecord.water === 0 &&
                 !selectedRecord.steps &&
                 !selectedRecord.sleepH &&
                 selectedRecord.meals.length === 0 &&
                 !selectedRecord.weight &&
                 !selectedRecord.mood &&
                 !selectedRecord.period?.active &&
                 !hasNoteContent(selectedRecord.note) ? (
                  <div className="py-12 text-center text-[#8A8271] text-xs bg-white rounded-xl border border-[#E4DECF] font-medium">
                    이날은 아직 작성된 건강 기록이 없습니다.
                  </div>
                ) : (
                  <>
                    {/* Water */}
                    {selectedRecord.water > 0 && (
                      <div className="p-3.5 bg-white rounded-xl border border-[#E4DECF] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Droplet className="w-4 h-4 text-[#799FCB]" />
                          <span className="text-xs font-bold text-[#2A2723]">수분 섭취량</span>
                        </div>
                        <span className="text-xs font-bold text-[#2A2723]">{selectedRecord.water}잔 ({selectedRecord.water * 250}ml)</span>
                      </div>
                    )}

                    {/* Steps */}
                    {selectedRecord.steps !== null && selectedRecord.steps > 0 && (
                      <div className="p-3.5 bg-white rounded-xl border border-[#E4DECF] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Footprints className="w-4 h-4 text-[#D08A2E]" />
                          <span className="text-xs font-bold text-[#2A2723]">걸음 수</span>
                        </div>
                        <span className="text-xs font-bold text-[#2A2723]">{selectedRecord.steps.toLocaleString()} 보</span>
                      </div>
                    )}

                    {/* Sleep */}
                    {selectedRecord.sleepH !== null && selectedRecord.sleepH > 0 && (
                      <div className="p-3.5 bg-white rounded-xl border border-[#E4DECF] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Moon className="w-4 h-4 text-[#6E63B6]" />
                          <span className="text-xs font-bold text-[#2A2723]">수면 시간</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-[#2A2723] block">{selectedRecord.sleepH} 시간</span>
                          {selectedRecord.sleepQ && (
                            <span className="text-[10px] text-[#8A8271] font-bold">
                              만족도: {'★'.repeat(selectedRecord.sleepQ)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Weight */}
                    {selectedRecord.weight !== null && selectedRecord.weight > 0 && (
                      <div className="p-3.5 bg-white rounded-xl border border-[#E4DECF] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Scale className="w-4 h-4 text-[#4E6B4A]" />
                          <span className="text-xs font-bold text-[#2A2723]">체중</span>
                        </div>
                        <span className="text-xs font-bold text-[#2A2723]">{selectedRecord.weight} kg</span>
                      </div>
                    )}

                    {/* Mood */}
                    {selectedRecord.mood !== null && (
                      <div className="p-3.5 bg-white rounded-xl border border-[#E4DECF] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Smile className="w-4 h-4 text-[#D69A55]" />
                          <span className="text-xs font-bold text-[#2A2723]">오늘의 기분</span>
                        </div>
                        <span className="text-xs font-bold text-[#2A2723]">
                          {selectedRecord.mood === 5 && '최고예요 😍'}
                          {selectedRecord.mood === 4 && '좋아요 🙂'}
                          {selectedRecord.mood === 3 && '보통이에요 😐'}
                          {selectedRecord.mood === 2 && '조금 피곤해요 🥱'}
                          {selectedRecord.mood === 1 && '힘들어요 😫'}
                        </span>
                      </div>
                    )}

                    {/* Menstrual cycle detail */}
                    {selectedRecord.period?.active && (
                      <div className="p-3.5 bg-[#C25E7A] text-white rounded-xl space-y-2 border border-[#C25E7A]">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white flex items-center gap-1">
                            <Heart className="w-4 h-4 fill-white text-white animate-pulse" />
                            생리 기록
                          </span>
                          <span className="px-2 py-0.5 bg-white rounded text-[10px] text-[#C25E7A] font-extrabold uppercase">
                            {selectedRecord.period.flow === 'light' && '양 적음'}
                            {selectedRecord.period.flow === 'medium' && '양 보통'}
                            {selectedRecord.period.flow === 'heavy' && '양 많음'}
                          </span>
                        </div>
                        {selectedRecord.period.symptoms.length > 0 && (
                          <div className="pt-2 border-t border-white/20">
                            <span className="text-[10px] text-white/85 font-bold block mb-1">동반 증상 목록</span>
                            <div className="flex flex-wrap gap-1">
                              {selectedRecord.period.symptoms.map((sym, sIdx) => (
                                <span key={sIdx} className="px-2 py-1 bg-white/10 text-white rounded-lg text-[10px] font-bold">
                                  {sym}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Meal details list */}
                    {selectedRecord.meals.length > 0 && (
                      <div className="p-3.5 bg-white border border-[#E4DECF] rounded-xl space-y-2.5">
                        <span className="text-xs font-bold text-[#2A2723] flex items-center gap-1.5 font-serif">
                          <Utensils className="w-4 h-4 text-[#C0663B]" />
                          섭취 식단 내역 ({selectedRecord.meals.length})
                        </span>
                        
                        <div className="space-y-1.5 pt-1">
                          {selectedRecord.meals.map((meal) => (
                            <div key={meal.id} className="bg-[#FBF9F3] p-2.5 rounded-lg border border-[#E4DECF]/60 flex justify-between items-center text-xs">
                              <div>
                                <span className="px-1.5 py-0.5 bg-[#F7EAE1] text-[#C0663B] rounded text-[9px] font-extrabold uppercase mr-1.5">
                                  {meal.type === 'breakfast' && '아침'}
                                  {meal.type === 'lunch' && '점심'}
                                  {meal.type === 'dinner' && '저녁'}
                                  {meal.type === 'snack' && '간식'}
                                </span>
                                <span className="font-bold text-[#2A2723]">{meal.name}</span>
                              </div>
                              <span className="font-bold text-[#C0663B]">{meal.kcal}kcal</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mind record (마음 기록) */}
                    {hasNoteContent(selectedRecord.note) && (
                      <div className="p-3.5 bg-white border border-[#E4DECF] rounded-xl space-y-3">
                        <span className="text-xs font-bold text-[#2A2723] flex items-center gap-1.5 font-serif">
                          <Heart className="w-4 h-4 text-[#B58A3C]" />
                          마음 기록
                        </span>
                        {selectedRecord.note?.diary?.trim() && (
                          <div>
                            <span className="text-[10px] font-bold text-[#8A8271] block mb-1">오늘의 일기</span>
                            <p className="text-xs text-[#2A2723] leading-relaxed whitespace-pre-wrap">{selectedRecord.note.diary}</p>
                          </div>
                        )}
                        {selectedRecord.note?.good?.trim() && (
                          <div>
                            <span className="text-[10px] font-bold text-[#8A8271] block mb-1">잘한 일</span>
                            <p className="text-xs text-[#2A2723] leading-relaxed whitespace-pre-wrap">{selectedRecord.note.good}</p>
                          </div>
                        )}
                        {selectedRecord.note?.bad?.trim() && (
                          <div>
                            <span className="text-[10px] font-bold text-[#8A8271] block mb-1">잘못한 일</span>
                            <p className="text-xs text-[#2A2723] leading-relaxed whitespace-pre-wrap">{selectedRecord.note.bad}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

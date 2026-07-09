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
  Heart
} from 'lucide-react';
import { DailyRecord, UserGoals } from '../types';
import { predictPeriod, formatDate, parseDate, addDays, getDaysDiff } from '../utils/period';

function hasNoteContent(note: DailyRecord['note']): boolean {
  return !!(note && (note.diary?.trim() || note.good?.trim() || note.bad?.trim()));
}

interface CalendarTabProps {
  allRecords: DailyRecord[];
  goals: UserGoals;
  todayStr: string;
}

export default function CalendarTab({ allRecords, goals, todayStr }: CalendarTabProps) {
  const [viewDate, setViewDate] = useState<Date>(new Date(todayStr));
  const [selectedRecord, setSelectedRecord] = useState<DailyRecord | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

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
            <div className="absolute inset-0" onClick={() => { setSelectedDateStr(null); setSelectedRecord(null); }} />

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
                  <h3 className="font-bold text-lg text-[#2A2723] font-serif">기록 상세 보기</h3>
                  <p className="text-xs text-[#8A8271] mt-0.5 font-mono">{selectedDateStr}</p>
                </div>
                <button
                  onClick={() => { setSelectedDateStr(null); setSelectedRecord(null); }}
                  className="w-8.5 h-8.5 hover:bg-[#EEE9DD] rounded-full text-[#7C7669] flex items-center justify-center transition border-none cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable logs */}
              <div className="flex-1 overflow-y-auto space-y-4 pb-6">
                
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
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

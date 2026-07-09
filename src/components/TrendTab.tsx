import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TrendingUp,
  Award,
  Calendar,
  CheckCircle,
  HelpCircle,
  Footprints,
  Droplet,
  Moon,
  Scale,
  Utensils,
  Smile
} from 'lucide-react';
import { DailyRecord, UserGoals } from '../types';
import { formatDate } from '../utils/period';

interface TrendTabProps {
  allRecords: DailyRecord[];
  goals: UserGoals;
}

type MetricType = 'steps' | 'water' | 'sleep' | 'weight' | 'kcal' | 'mood';

export default function TrendTab({ allRecords, goals }: TrendTabProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('steps');

  // Sort records chronologically (oldest to newest) for line charts
  const sortedRecords = [...allRecords].sort((a, b) => a.date.localeCompare(b.date));

  // Limit to last 14 days for the chart
  const chartRecords = sortedRecords.slice(-14);

  // Map metric definitions for easy UI rendering
  const metricsConfig = {
    steps: {
      label: '걸음 수',
      color: '#D08A2E',
      icon: Footprints,
      unit: '보',
      bg: 'bg-[#D08A2E]',
      text: 'text-white',
      goal: goals.steps,
      getValue: (r: DailyRecord) => r.steps || 0,
    },
    water: {
      label: '수분 섭취',
      color: '#799FCB',
      icon: Droplet,
      unit: '잔',
      bg: 'bg-[#799FCB]',
      text: 'text-white',
      goal: goals.water,
      getValue: (r: DailyRecord) => r.water || 0,
    },
    sleep: {
      label: '수면 시간',
      color: '#6E63B6',
      icon: Moon,
      unit: '시간',
      bg: 'bg-[#6E63B6]',
      text: 'text-white',
      goal: goals.sleep,
      getValue: (r: DailyRecord) => r.sleepH || 0,
    },
    kcal: {
      label: '섭취 칼로리',
      color: '#C0663B',
      icon: Utensils,
      unit: 'kcal',
      bg: 'bg-[#C0663B]',
      text: 'text-white',
      goal: goals.kcal,
      getValue: (r: DailyRecord) => r.meals.reduce((sum, m) => sum + m.kcal, 0),
    },
    weight: {
      label: '체중',
      color: '#4E6B4A',
      icon: Scale,
      unit: 'kg',
      bg: 'bg-[#4E6B4A]',
      text: 'text-white',
      goal: null,
      getValue: (r: DailyRecord) => r.weight || 0,
    },
    mood: {
      label: '컨디션',
      color: '#C25E7A',
      icon: Smile,
      unit: '점',
      bg: 'bg-[#C25E7A]',
      text: 'text-white',
      goal: null,
      getValue: (r: DailyRecord) => r.mood || 0,
    },
  };

  const currentConfig = metricsConfig[selectedMetric];

  // Map data specifically for Recharts
  const chartData = chartRecords.map((r) => {
    // Format date from YYYY-MM-DD to MM/DD
    const parts = r.date.split('-');
    const formattedDate = parts.length === 3 ? `${parts[1]}/${parts[2]}` : r.date;
    const value = currentConfig.getValue(r);

    return {
      date: formattedDate,
      fullDate: r.date,
      [currentConfig.label]: value,
    };
  });

  // Calculate statistics (Average, Maximum, Minimum) based on valid values
  const validValues = sortedRecords
    .map((r) => currentConfig.getValue(r))
    .filter((val) => val > 0); // exclude 0 or nulls

  const avgValue = validValues.length
    ? Math.round((validValues.reduce((sum, v) => sum + v, 0) / validValues.length) * 10) / 10
    : 0;
  const maxValue = validValues.length ? Math.max(...validValues) : 0;
  const minValue = validValues.length ? Math.min(...validValues) : 0;

  // Calculate goal achievement rate (only for goal-based metrics)
  const goalAchievementCount = currentConfig.goal
    ? sortedRecords.filter((r) => currentConfig.getValue(r) >= (currentConfig.goal as number)).length
    : 0;
  const goalAchievementPct = sortedRecords.length
    ? Math.round((goalAchievementCount / sortedRecords.length) * 100)
    : 0;

  // Recent 7 days record list (newest first)
  const recentRecords = [...allRecords]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  const getDayName = (dateStr: string) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const d = new Date(dateStr);
    return days[isNaN(d.getDay()) ? 0 : d.getDay()];
  };

  // Radar chart: today's goal-achievement rate across core health check items
  const todayStr = formatDate(new Date());
  const todayRecord = allRecords.find((r) => r.date === todayStr) || null;
  const todayKcal = todayRecord ? todayRecord.meals.reduce((sum, m) => sum + m.kcal, 0) : 0;

  const radarData = [
    { axis: '수분', value: todayRecord ? Math.min(100, Math.round((todayRecord.water / goals.water) * 100)) : 0 },
    { axis: '걸음', value: todayRecord ? Math.min(100, Math.round(((todayRecord.steps || 0) / goals.steps) * 100)) : 0 },
    { axis: '수면', value: todayRecord ? Math.min(100, Math.round(((todayRecord.sleepH || 0) / goals.sleep) * 100)) : 0 },
    { axis: '식단', value: todayRecord ? Math.min(100, Math.round((todayKcal / goals.kcal) * 100)) : 0 },
    { axis: '컨디션', value: todayRecord ? Math.min(100, Math.round(((todayRecord.mood || 0) / 5) * 100)) : 0 },
  ];
  const hasRadarData = radarData.some((d) => d.value > 0);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold tracking-widest text-[#8A8271] uppercase font-mono">ANALYTICS</p>
        <h1 className="text-2xl font-bold tracking-tight text-[#2A2723] font-serif mt-0.5">건강 분석 및 추세</h1>
        <p className="text-xs text-[#8A8271] mt-1">지속해온 기록들을 돌아보며 나만의 페이스를 확인해 보세요.</p>
      </div>

      {/* Radar Chart: Today's Health Check Balance */}
      <div className="bg-[#FBF9F3] rounded-2xl p-6 border border-[#E4DECF] shadow-xs">
        <div className="mb-4">
          <h3 className="font-bold text-base text-[#2A2723] font-serif">오늘의 건강 밸런스</h3>
          <p className="text-xs text-[#8A8271] mt-0.5">목표 대비 각 항목의 달성률을 한눈에 확인해요</p>
        </div>

        {hasRadarData ? (
          <div className="w-full h-[280px]" id="chart-radar-container">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="#E4DECF" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: '#8A8271', fontSize: 11, fontWeight: 700 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#B8AF9C', fontSize: 9 }} tickCount={5} />
                <Radar
                  name="달성률"
                  dataKey="value"
                  stroke="#6F8F6A"
                  fill="#6F8F6A"
                  fillOpacity={0.35}
                  strokeWidth={2}
                  animationDuration={600}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#F9F6EF',
                    border: '1px solid #E4DECF',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#2A2723',
                  }}
                  formatter={(value: number) => [`${value}%`, '달성률']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-[#8A8271] text-xs">
            오늘 기록된 데이터가 아직 없습니다.
          </div>
        )}
      </div>

      {/* Tabs Chips Row */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(Object.keys(metricsConfig) as MetricType[]).map((key) => {
          const cfg = metricsConfig[key];
          const Icon = cfg.icon;
          const active = selectedMetric === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedMetric(key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 border cursor-pointer border-none ${
                active
                  ? 'bg-[#6F8F6A] text-white'
                  : 'bg-[#FBF9F3] border border-[#E4DECF] hover:bg-[#F2EEE2] text-[#8A8271]'
              }`}
              id={`tab-trend-${key}`}
            >
              <Icon className="w-4 h-4" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Recharts Area Card */}
      <div className="bg-[#FBF9F3] rounded-2xl p-6 border border-[#E4DECF] shadow-xs">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-base text-[#2A2723] font-serif">{currentConfig.label} 트렌드</h3>
            <p className="text-xs text-[#8A8271] mt-0.5">최근 14일 추세 꺾은선 그래프</p>
          </div>
          {currentConfig.goal && (
            <span className="text-[10px] px-2.5 py-1.5 bg-[#FFFDF9] text-[#8A8271] rounded-lg border border-[#E4DECF] font-bold font-mono">
              목표치: {currentConfig.goal.toLocaleString()} {currentConfig.unit}
            </span>
          )}
        </div>

        {chartData.length > 0 ? (
          <div className="w-full h-[300px]" id="chart-trend-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4DECF" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#8A8271', fontSize: 10, fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#8A8271', fontSize: 10, fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#F9F6EF',
                    border: '1px solid #E4DECF',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#2A2723',
                  }}
                />
                {/* Reference line for Goals */}
                {currentConfig.goal && (
                  <ReferenceLine
                    y={currentConfig.goal}
                    stroke="#6F8F6A"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey={currentConfig.label}
                  stroke={currentConfig.color}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, strokeWidth: 1.5, stroke: currentConfig.color, fill: '#FFFDF9' }}
                  activeDot={{ r: 5.5, strokeWidth: 0, fill: currentConfig.color }}
                  animationDuration={600}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-[#8A8271] text-xs">
            기록된 데이터가 충분하지 않습니다.
          </div>
        )}
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#FBF9F3] rounded-2xl p-4.5 border border-[#E4DECF] text-center shadow-xs">
          <span className="text-[10px] text-[#8A8271] uppercase tracking-wider block font-bold font-mono">전체 평균</span>
          <span className="text-xl font-bold tracking-tight text-[#2A2723] mt-1 block font-serif">
            {avgValue ? avgValue.toLocaleString() : '-'}
            <span className="text-xs text-[#8A8271] font-bold ml-0.5">{currentConfig.unit}</span>
          </span>
        </div>

        <div className="bg-[#FBF9F3] rounded-2xl p-4.5 border border-[#E4DECF] text-center shadow-xs">
          <span className="text-[10px] text-[#8A8271] uppercase tracking-wider block font-bold font-mono">최고 수치</span>
          <span className="text-xl font-bold tracking-tight text-[#2A2723] mt-1 block font-serif">
            {maxValue ? maxValue.toLocaleString() : '-'}
            <span className="text-xs text-[#8A8271] font-bold ml-0.5">{currentConfig.unit}</span>
          </span>
        </div>

        <div className="bg-[#FBF9F3] rounded-2xl p-4.5 border border-[#E4DECF] text-center shadow-xs">
          <span className="text-[10px] text-[#8A8271] uppercase tracking-wider block font-bold font-mono">최저 수치</span>
          <span className="text-xl font-bold tracking-tight text-[#2A2723] mt-1 block font-serif">
            {minValue ? minValue.toLocaleString() : '-'}
            <span className="text-xs text-[#8A8271] font-bold ml-0.5">{currentConfig.unit}</span>
          </span>
        </div>

        {currentConfig.goal && (
          <div className="bg-white rounded-2xl p-5 border border-[#E4DECF] col-span-3 flex items-center justify-between shadow-xs">
            <div className="flex gap-3">
              <div className="p-2.5 bg-[#FBF9F3] border border-[#E4DECF] text-[#6F8F6A] rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#2A2723] font-serif">목표 달성 빈도</h4>
                <p className="text-[11px] text-[#8A8271] mt-0.5">총 {sortedRecords.length}일 중 {goalAchievementCount}일 목표 달성 완료</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-[#6F8F6A] font-serif">{goalAchievementPct}%</span>
              <span className="text-[9px] text-[#8A8271] block font-bold font-mono">달성률</span>
            </div>
          </div>
        )}
      </div>

      {/* Recent History Feed (7 days) */}
      <div className="bg-[#FBF9F3] rounded-2xl p-6 border border-[#E4DECF] shadow-xs">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="font-bold text-base text-[#2A2723] font-serif">최근 일별 기록 피드</h3>
            <p className="text-xs text-[#8A8271] mt-0.5">기록된 각 일자의 요약 목록 (최근 7일)</p>
          </div>
          <Calendar className="w-4 h-4 text-[#6F8F6A]" />
        </div>

        <div className="space-y-3">
          {recentRecords.map((r) => {
            const dateParts = r.date.split('-');
            const displayDate = `${dateParts[1]}월 ${dateParts[2]}일`;
            const dayName = getDayName(r.date);

            const recordKcal = r.meals.reduce((sum, m) => sum + m.kcal, 0);

            return (
              <div
                key={r.date}
                className="p-3.5 bg-white border border-[#E4DECF] rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-[#6F8F6A]/50 transition shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="text-center bg-[#FBF9F3] border border-[#E4DECF] px-2.5 py-1.5 rounded-xl flex-shrink-0 min-w-[52px]">
                    <span className="text-[10px] text-[#8A8271] block font-bold leading-tight">{dayName}요일</span>
                    <span className="text-xs font-bold text-[#2A2723] leading-tight mt-0.5 block font-serif">{dateParts[2]}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#2A2723] font-serif">{displayDate}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {r.period?.active && (
                        <span className="px-1.5 py-0.5 bg-[#F8E7EC] text-[#C25E7A] text-[9px] font-bold rounded">
                          생리
                        </span>
                      )}
                      {r.mood && (
                        <span className="px-1.5 py-0.5 bg-[#FFF9E6] border border-[#FFF0CC] text-[#D08A2E] text-[9px] font-bold rounded flex items-center gap-0.5">
                          기분
                          <span>
                            {r.mood === 5 && '😍'}
                            {r.mood === 4 && '🙂'}
                            {r.mood === 3 && '😐'}
                            {r.mood === 2 && '🥱'}
                            {r.mood === 1 && '😫'}
                          </span>
                        </span>
                      )}
                      {r.weight && (
                        <span className="px-1.5 py-0.5 bg-[#F2F7F2] border border-[#E2EFE2] text-[#4E6B4A] text-[9px] font-bold rounded">
                          {r.weight}kg
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Horizontal progress summary */}
                <div className="flex gap-4 text-[11px] font-bold text-[#2A2723]">
                  <div className="flex items-center gap-1">
                    <Droplet className="w-3.5 h-3.5 text-[#799FCB]" />
                    <span>{r.water}잔</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Footprints className="w-3.5 h-3.5 text-[#D08A2E]" />
                    <span>{r.steps ? r.steps.toLocaleString() : 0}보</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5 text-[#6E63B6]" />
                    <span>{r.sleepH || 0}H</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Utensils className="w-3.5 h-3.5 text-[#C0663B]" />
                    <span>{recordKcal}kcal</span>
                  </div>
                </div>
              </div>
            );
          })}

          {recentRecords.length === 0 && (
            <p className="text-xs text-[#8A8271] py-6 text-center bg-white rounded-xl border border-[#E4DECF]">아직 기록된 일별 내역이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

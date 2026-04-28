'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import { cn } from '@/lib/utils';
import { fetchRecordsByMonth } from '@/lib/api';
import type { TravelRecord } from '@/lib/types';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const categoryEmoji: Record<string, string> = {
  travel: '✈️',
  daily: '📖',
};

const THEMES = [
  { id: 'violet', label: '보라', rgb: '124, 58, 237' },
  { id: 'rose',   label: '핑크', rgb: '225, 29, 72' },
  { id: 'sky',    label: '하늘', rgb: '2, 132, 199' },
  { id: 'emerald',label: '초록', rgb: '5, 150, 105' },
  { id: 'amber',  label: '주황', rgb: '217, 119, 6' },
  { id: 'pink',   label: '분홍', rgb: '236, 72, 153' },
  { id: 'teal',   label: '청록', rgb: '13, 148, 136' },
];

// 기록 수 → 불투명도 (0개=없음, 1~5단계)
const INTENSITY: Record<number, number> = {
  0: 0,
  1: 0.15,
  2: 0.35,
  3: 0.55,
  4: 0.75,
  5: 0.92,
};

function getOpacity(count: number): number {
  return INTENSITY[Math.min(count, 5)];
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<TravelRecord[]>([]);
  const [records, setRecords] = useState<TravelRecord[]>([]);
  const [themeId, setThemeId] = useState<string>('violet');

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayKey = new Date().toISOString().split('T')[0];

  // 테마 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('calendar-theme');
    if (saved && THEMES.find((t) => t.id === saved)) setThemeId(saved);
  }, []);

  useEffect(() => {
    fetchRecordsByMonth(year, month + 1).then(setRecords).catch(console.error);
  }, [year, month]);

  const handleThemeChange = (id: string) => {
    setThemeId(id);
    localStorage.setItem('calendar-theme', id);
  };

  const recordsByDate = useMemo(() => {
    const map: Record<string, TravelRecord[]> = {};
    records.forEach((record) => {
      if (!map[record.date]) map[record.date] = [];
      map[record.date].push(record);
    });
    return map;
  }, [records]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    return days;
  }, [year, month]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
    setSelectedRecords([]);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
    setSelectedRecords([]);
  };

  const handleDateClick = (day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateKey);
    setSelectedRecords(recordsByDate[dateKey] || []);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-24">
        <header className="px-5 pt-14 pb-3">
          <h1 className="text-2xl font-bold text-primary tracking-tight italic">캘린더</h1>
        </header>

        {/* 테마 컬러 선택 */}
        <div className="px-5 mb-4 flex items-center gap-3">
          <span className="text-xs text-muted-foreground shrink-0">테마 색상</span>
          <div className="flex items-center gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                title={t.label}
                className="transition-all duration-150"
                style={{
                  width: themeId === t.id ? 28 : 22,
                  height: themeId === t.id ? 28 : 22,
                  borderRadius: '50%',
                  backgroundColor: `rgba(${t.rgb}, 1)`,
                  boxShadow: themeId === t.id
                    ? `0 0 0 2px white, 0 0 0 4px rgba(${t.rgb}, 0.8)`
                    : 'none',
                  opacity: themeId === t.id ? 1 : 0.5,
                }}
              />
            ))}
          </div>
        </div>

        <main className="px-5">
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-card transition-colors">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <h2 className="text-lg font-semibold text-foreground">
              {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-card transition-colors">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
          </div>

          {/* 캘린더 그리드 */}
          <div className="bg-card rounded-2xl p-4">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((day, i) => (
                <div
                  key={day}
                  className={cn(
                    'text-center text-xs font-medium py-2',
                    i === 0 ? 'text-rose-400' : 'text-muted-foreground'
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-y-1">
              {calendarDays.map((day, index) => {
                if (day === null) return <div key={`empty-${index}`} className="aspect-square" />;

                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const count = recordsByDate[dateKey]?.length ?? 0;
                const opacity = getOpacity(count);
                const isSelected = selectedDate === dateKey;
                const isToday = todayKey === dateKey;
                const isSunday = index % 7 === 0;
                const isDark = count >= 4; // 배경이 진해서 흰 글자 필요

                let boxShadow = 'none';
                if (isSelected) {
                  boxShadow = `0 0 0 2px rgba(${theme.rgb}, 1), 0 0 0 4px rgba(${theme.rgb}, 0.2)`;
                } else if (isToday && count === 0) {
                  boxShadow = '0 0 0 1.5px rgba(0,0,0,0.18)';
                }

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className="aspect-square flex items-center justify-center"
                  >
                    <div
                      className="relative w-[82%] aspect-square flex items-center justify-center rounded-full transition-all duration-150"
                      style={{
                        backgroundColor:
                          count > 0
                            ? `rgba(${theme.rgb}, ${opacity})`
                            : isSelected
                            ? `rgba(${theme.rgb}, 0.08)`
                            : 'transparent',
                        boxShadow,
                      }}
                    >
                      {/* 오늘 표시 점 (기록 있을 때도 표시) */}
                      {isToday && (
                        <span
                          className="absolute bottom-[10%] w-1 h-1 rounded-full"
                          style={{ backgroundColor: `rgba(${theme.rgb}, ${isDark ? 0.6 : 0.9})` }}
                        />
                      )}

                      <span
                        className={cn(
                          'text-sm font-medium leading-none select-none',
                          isDark
                            ? 'text-white'
                            : isSunday
                            ? 'text-rose-400'
                            : 'text-foreground',
                          isSelected && 'font-bold',
                        )}
                      >
                        {day}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 범례 */}
          <div className="flex items-center justify-end gap-1.5 mt-2.5 pr-1">
            <span className="text-[11px] text-muted-foreground mr-0.5">적음</span>
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: `rgba(${theme.rgb}, ${INTENSITY[level]})` }}
              />
            ))}
            <span className="text-[11px] text-muted-foreground ml-0.5">많음</span>
          </div>

          {/* 선택된 날짜 패널 */}
          {selectedDate && (
            <div className="mt-4 bg-card rounded-2xl p-4 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: `rgba(${theme.rgb}, 0.9)` }}
                  />
                  <h3 className="font-semibold text-foreground">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  {selectedRecords.length > 0 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `rgba(${theme.rgb}, 0.12)`,
                        color: `rgba(${theme.rgb}, 1)`,
                      }}
                    >
                      {selectedRecords.length}개
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setSelectedDate(null); setSelectedRecords([]); }}
                  className="p-1.5 rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {selectedRecords.length > 0 ? (
                <div className="space-y-3">
                  {selectedRecords.map((record) => (
                    <Link
                      key={record.id}
                      href={`/record/${record.id}`}
                      className="flex gap-3 p-2 -mx-2 rounded-xl hover:bg-muted transition-colors"
                    >
                      {record.images[0] && (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                          <Image src={record.images[0]} alt="" fill className="object-cover" sizes="56px" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm">{categoryEmoji[record.category] || '📝'}</span>
                          <p className="font-medium text-foreground truncate">
                            {record.title || record.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs truncate">{record.location}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-3xl mb-2">📅</p>
                  <p className="text-sm text-muted-foreground">이 날짜에 기록이 없습니다</p>
                </div>
              )}
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

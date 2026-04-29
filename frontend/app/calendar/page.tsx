'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import { cn } from '@/lib/utils';
import { fetchRecordsByMonth } from '@/lib/api';
import type { TravelRecord } from '@/lib/types';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const categoryEmoji: Record<string, string> = {
  travel: '✈️',
  daily: '📖',
};

// 고정 테마: 초록
const THEME = { rgb: '5, 150, 105', primary: '#059669' };

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<TravelRecord[]>([]);
  const [records, setRecords] = useState<TravelRecord[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayKey = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchRecordsByMonth(year, month + 1, true).then(setRecords).catch(console.error);
  }, [year, month]);

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

  const getGlowStyle = (count: number) => {
    if (count === 0) return {};
    const opacity = Math.min(0.15 + count * 0.18, 0.9);
    const size = 36 + count * 4;
    return {
      background: `radial-gradient(circle, rgba(${THEME.rgb}, ${opacity}) 0%, transparent 70%)`,
      width: `${size}px`,
      height: `${size}px`,
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 배경 장식 */}
      <div
        className="fixed top-20 right-8 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: THEME.primary }}
      />
      <div
        className="fixed bottom-32 left-8 w-36 h-36 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: THEME.primary }}
      />

      <div className="max-w-lg mx-auto pb-28 px-5">
        {/* 메인 카드 */}
        <div className="mt-10 bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg shadow-stone-200/40 border border-stone-100 p-6">

          {/* 헤더 */}
          <div className="mb-6">
            <h1
              className="text-2xl font-bold tracking-tight text-primary"
            >
              캘린더
            </h1>
          </div>

          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-stone-700">
              {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-600"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* 캘린더 그리드 */}
          <div className="bg-stone-50/50 rounded-2xl p-4">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map((day, i) => (
                <div
                  key={day}
                  className={cn(
                    'text-center text-xs font-medium py-2',
                    i === 0 ? 'text-rose-400' : 'text-stone-400'
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-y-1">
              {calendarDays.map((day, index) => {
                if (day === null) return <div key={`empty-${index}`} className="h-12" />;

                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const count = recordsByDate[dateKey]?.length ?? 0;
                const isSelected = selectedDate === dateKey;
                const isToday = todayKey === dateKey;
                const isSunday = index % 7 === 0;
                const isDark = count >= 4;

                let boxShadow = 'none';
                if (isSelected) {
                  boxShadow = `0 0 0 2px rgba(${THEME.rgb}, 1), 0 0 0 4px rgba(${THEME.rgb}, 0.2)`;
                } else if (isToday && count === 0) {
                  boxShadow = '0 0 0 1.5px rgba(0,0,0,0.18)';
                }

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className="relative flex items-center justify-center h-12"
                  >
                    {count > 0 && (
                      <div
                        className="absolute rounded-full blur-sm transition-all duration-500"
                        style={getGlowStyle(count)}
                      />
                    )}
                    <div
                      className="relative z-10 w-[82%] aspect-square flex items-center justify-center rounded-full transition-all duration-150"
                      style={{ boxShadow }}
                    >
                      {isToday && (
                        <span
                          className="absolute bottom-[10%] w-1 h-1 rounded-full"
                          style={{ backgroundColor: `rgba(${THEME.rgb}, ${isDark ? 0.6 : 0.9})` }}
                        />
                      )}
                      <span
                        className={cn(
                          'text-sm font-medium leading-none select-none',
                          isDark
                            ? 'text-stone-700'
                            : isSunday
                            ? 'text-rose-400'
                            : 'text-stone-600',
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
        </div>

        {/* 선택된 날짜 패널 */}
        {selectedDate && (
          <div className="mt-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg shadow-stone-200/40 border border-stone-100 p-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: `rgba(${THEME.rgb}, 0.9)` }}
                />
                <h3 className="font-semibold text-stone-700">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                {selectedRecords.length > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `rgba(${THEME.rgb}, 0.12)`,
                      color: `rgba(${THEME.rgb}, 1)`,
                    }}
                  >
                    {selectedRecords.length}개
                  </span>
                )}
              </div>
              <button
                onClick={() => { setSelectedDate(null); setSelectedRecords([]); }}
                className="p-1.5 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="h-4 w-4 text-stone-400" />
              </button>
            </div>

            {selectedRecords.length > 0 ? (
              <div className="space-y-3">
                {selectedRecords.map((record) => (
                  <Link
                    key={record.id}
                    href={`/record/${record.id}`}
                    className="flex gap-3 p-2 -mx-2 rounded-xl hover:bg-stone-50 transition-colors"
                  >
                    {record.images[0] && (
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={record.images[0]} alt="" fill className="object-cover" sizes="56px" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">{categoryEmoji[record.category] || '📝'}</span>
                        <p className="font-medium text-stone-700 truncate">
                          {new Date(record.date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                        </p>
                      </div>
                      {record.contentPreview && (
                        <p className="text-xs text-stone-400 truncate">{record.contentPreview}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-sm text-stone-400">이 날짜에 기록이 없습니다</p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import { cn } from '@/lib/utils';
import { dummyRecords } from '@/lib/dummy-data';
import type { TravelRecord, Category } from '@/lib/types';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const categoryEmoji: Record<Category, string> = {
  travel: '✈️',
  performance: '🎤',
  romance: '💕',
  parenting: '👶',
  friendship: '🤝',
  daily: '📖',
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<TravelRecord[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const recordsByDate = useMemo(() => {
    const map: Record<string, TravelRecord[]> = {};
    dummyRecords.forEach((record) => {
      const dateKey = record.date;
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(record);
    });
    return map;
  }, []);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

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

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-24">
        {/* Header */}
        <header className="px-5 pt-14 pb-6">
          <h1 className="text-2xl font-bold text-primary tracking-tight italic">캘린더</h1>
        </header>

        <main className="px-5">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-card transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">
            {formatMonthYear(currentDate)}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-card transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-card rounded-2xl p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day, index) => (
              <div
                key={day}
                className={cn(
                  'text-center text-sm font-medium py-2',
                  index === 0 ? 'text-rose-400' : 'text-muted-foreground'
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasRecords = recordsByDate[dateKey]?.length > 0;
              const isSelected = selectedDate === dateKey;
              const isToday =
                new Date().toISOString().split('T')[0] === dateKey;
              const isSunday = index % 7 === 0;

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    'aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all relative',
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : isToday
                        ? 'bg-muted font-bold ring-2 ring-primary/30'
                        : 'hover:bg-muted',
                    isSunday && !isSelected && 'text-rose-400'
                  )}
                >
                  <span>{day}</span>
                  {hasRecords && (
                    <span
                      className={cn(
                        'absolute bottom-1 w-1.5 h-1.5 rounded-full',
                        isSelected ? 'bg-primary-foreground' : 'bg-primary'
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Records */}
        {selectedDate && (
          <div className="mt-4 bg-card rounded-2xl p-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">
                {new Date(selectedDate).toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedRecords([]);
                }}
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
                        <Image
                          src={record.images[0]}
                          alt={record.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">{categoryEmoji[record.category]}</span>
                        <p className="font-medium text-foreground truncate">
                          {record.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="text-xs truncate">
                          {record.location}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-sm text-muted-foreground">
                  이 날짜에 기록이 없습니다
                </p>
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

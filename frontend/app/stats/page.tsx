'use client';

import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { fetchRecordStats } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const categoryEmoji: Record<string, string> = {
  travel: '✈️',
  daily: '📖',
};

const categoryLabel: Record<string, string> = {
  travel: '여행',
  daily: '일상',
};

const CATEGORY_COLORS: Record<string, string> = {
  travel: '#f59e0b',
  daily: '#64748b',
};

const CHART_PRIMARY = '#2dd4bf';

export default function StatsPage() {
  const [stats, setStats] = useState({
    totalRecords: 0,
    uniqueLocations: 0,
    topTags: [] as [string, number][],
    monthlyData: [] as { month: string; count: number }[],
    categoryData: [] as { id: string; name: string; emoji: string; value: number; color: string }[],
  });

  useEffect(() => {
    fetchRecordStats().then((data) => {
      const monthlyData = data.monthly_counts.map(({ month, count }: { month: string; count: number }) => {
        const [, monthNum] = month.split('-');
        return { month: `${parseInt(monthNum)}월`, count };
      });
      const categoryData = data.category_counts.map(({ category, count }: { category: string; count: number }) => ({
        id: category,
        name: categoryLabel[category] || category,
        emoji: categoryEmoji[category] || '📝',
        value: count,
        color: CATEGORY_COLORS[category] || '#94a3b8',
      }));
      const topTags: [string, number][] = data.top_tags.map(({ tag, count }: { tag: string; count: number }) => [tag, count]);
      setStats({
        totalRecords: data.total_records,
        uniqueLocations: data.unique_locations,
        topTags,
        monthlyData,
        categoryData,
      });
    }).catch(console.error);
  }, []);

  const chartConfig = {
    count: { label: '기록 수', color: CHART_PRIMARY },
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-24">
        <header className="px-5 pt-14 pb-6">
          <h1 className="text-2xl font-bold text-primary tracking-tight italic">통계</h1>
        </header>

        <main className="px-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-2xl p-4">
              <p className="text-sm text-muted-foreground mb-1">총 기록</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalRecords}</p>
            </div>
            <div className="bg-card rounded-2xl p-4">
              <p className="text-sm text-muted-foreground mb-1">방문 장소</p>
              <p className="text-3xl font-bold text-foreground">{stats.uniqueLocations}</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-5">
            <h2 className="font-semibold text-foreground mb-4">많이 사용한 태그</h2>
            <div className="space-y-3">
              {stats.topTags.map(([tag, count], index) => (
                <div key={tag} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-4">{index + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{tag}</span>
                      <span className="text-sm text-muted-foreground">{count}회</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(count / stats.topTags[0][1]) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {stats.monthlyData.length > 0 && (
            <div className="bg-card rounded-2xl p-5">
              <h2 className="font-semibold text-foreground mb-4">월별 기록</h2>
              <ChartContainer config={chartConfig} className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyData}>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} fill={CHART_PRIMARY} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}

          {stats.categoryData.length > 0 && (
            <div className="bg-card rounded-2xl p-5">
              <h2 className="font-semibold text-foreground mb-4">카테고리별 비율</h2>
              <div className="flex items-center gap-6">
                <ChartContainer config={chartConfig} className="h-36 w-36 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={28} outerRadius={56} paddingAngle={3}>
                        {stats.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex-1 space-y-2">
                  {stats.categoryData.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <span className="text-base">{cat.emoji}</span>
                      <span className="text-sm text-foreground flex-1">{cat.name}</span>
                      <span className="text-sm text-muted-foreground">{cat.value}개</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

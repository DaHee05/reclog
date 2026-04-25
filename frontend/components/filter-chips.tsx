'use client';

import { cn } from '@/lib/utils';
import { FILTER_CHIPS } from '@/lib/types';

interface FilterChipsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function FilterChips({ activeFilter, onFilterChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
      {FILTER_CHIPS.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onFilterChange(chip.id)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
            activeFilter === chip.id
              ? 'bg-foreground text-background'
              : 'bg-card text-muted-foreground hover:text-foreground'
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

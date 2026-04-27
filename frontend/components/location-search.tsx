'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Place {
  place_name: string;
  address_name: string;
  road_address_name?: string;
}

interface LocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function LocationSearch({ value, onChange, className }: LocationSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Place[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = async (keyword: string) => {
    if (!keyword.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      const res = await fetch(
        `${API_URL}/api/places?query=${encodeURIComponent(keyword)}`,
        { headers }
      );
      if (!res.ok) return;

      const data: Place[] = await res.json();
      setResults(data);
      setIsOpen(data.length > 0);
    } catch {
      setResults([]);
    }
  };

  const triggerSearch = (val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(val), 300);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    triggerSearch(val);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    const val = (e.target as HTMLInputElement).value;
    triggerSearch(val);
  };

  const handleSelect = (place: Place) => {
    setQuery(place.place_name);
    onChange(place.place_name);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          placeholder="장소를 검색하세요 (선택)"
          value={query}
          onChange={handleInputChange}
          onCompositionEnd={handleCompositionEnd}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          className="bg-card border border-border/50 rounded-xl h-12 pl-4 pr-10 focus:border-primary transition-colors"
        />
        {query ? (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {results.map((place, i) => (
            <button
              key={`${place.place_name}-${i}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(place)}
              className={cn(
                'w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-start gap-3',
                i !== results.length - 1 && 'border-b border-border/30'
              )}
            >
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{place.place_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {place.road_address_name || place.address_name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="text-center">
        <p className="text-4xl mb-4">😵</p>
        <h2 className="text-lg font-bold text-foreground mb-2">오류가 발생했습니다</h2>
        <p className="text-sm text-muted-foreground mb-6">{error.message || '알 수 없는 오류입니다.'}</p>
        <Button onClick={reset} className="rounded-full">
          다시 시도
        </Button>
      </div>
    </div>
  );
}

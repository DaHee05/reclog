'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { joinSharedSpace } from '@/lib/api';

export default function JoinSpacePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const space = await joinSharedSpace(code);
      router.push(`/spaces/${space.id}`);
    } catch (e: unknown) {
      const err = e as Error & { status?: number };
      if (err.status === 404) setError('존재하지 않는 코드입니다.');
      else if (err.status === 409) setError('이미 참여한 공유 공간입니다.');
      else setError('참여에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-24">
        <header className="sticky top-0 z-50 bg-background px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground">공유 공간 참여</h1>
          </div>
        </header>

        <main className="px-5 py-10 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-4xl">🔗</p>
            <p className="text-sm text-muted-foreground">
              친구에게 받은 6자리 코드를 입력하세요.<br />
              함께 기록을 나눌 수 있습니다.
            </p>
          </div>

          <Input
            placeholder="코드 6자리 입력"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            maxLength={6}
            className="bg-card rounded-xl h-16 text-center text-2xl tracking-widest font-bold border-border"
          />

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            onClick={handleJoin}
            disabled={code.length !== 6 || loading}
            className="w-full rounded-full h-12"
          >
            {loading ? '참여 중...' : '참여하기'}
          </Button>
        </main>
      </div>
    </div>
  );
}

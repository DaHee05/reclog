'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
    <html>
      <body style={{ margin: 0, background: '#fafaf9', fontFamily: 'sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>😵</p>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>오류가 발생했습니다</h2>
            <p style={{ fontSize: '14px', color: '#78716c', marginBottom: '24px' }}>{error.message || '알 수 없는 오류입니다.'}</p>
            <button
              onClick={reset}
              style={{ padding: '10px 24px', borderRadius: '999px', background: '#2dd4bf', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

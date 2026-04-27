'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Package, Loader2 } from 'lucide-react';
import { fetchPhotobooks, updatePhotobookStatus, type PhotobookOrder } from '@/lib/api';

const statusConfig: Record<string, { label: string; colorClass: string; iconColor: string }> = {
  pending: { label: '준비중', colorClass: 'text-muted-foreground', iconColor: 'text-muted-foreground' },
  processing: { label: '제작중', colorClass: 'text-blue-600 font-bold', iconColor: 'text-blue-600' },
  completed: { label: '제작완료', colorClass: 'text-green-600 font-bold', iconColor: 'text-green-600' },
  shipping: { label: '배송중', colorClass: 'text-indigo-600 font-bold', iconColor: 'text-indigo-600' },
  delivered: { label: '배송완료', colorClass: 'text-foreground font-bold', iconColor: 'text-foreground' },
};

const statusFlow = ['pending', 'processing', 'completed', 'shipping', 'delivered'] as const;

export default function PhotobookListPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PhotobookOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await fetchPhotobooks();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStatus = async (orderId: string, currentStatus: string) => {
    const currentIndex = statusFlow.indexOf(currentStatus as any);
    if (currentIndex >= 0 && currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      try {
        await updatePhotobookStatus(orderId, nextStatus);
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      } catch (e) {
        console.error('Failed to update status', e);
      }
    }
  };

  const formatDateHeader = (dateString: string) => {
    const d = new Date(dateString);
    const yy = d.getFullYear().toString().slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}.${mm}.${dd}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-lg mx-auto pb-24">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground">포토북 주문 내역</h1>
          </div>
        </header>

        <main className="px-5 py-6 space-y-8">
          {orders.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">주문 내역이 없습니다.</p>
            </div>
          ) : (
            orders.map((order) => {
              const config = statusConfig[order.status];
              return (
                <div key={order.id} className="space-y-3">
                  {/* Date Header */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-lg font-bold text-foreground">
                      {formatDateHeader(order.created_at)}
                    </span>
                    <button className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                      주문상세 <ChevronRight className="h-4 w-4 ml-0.5" />
                    </button>
                  </div>

                  {/* Order Card */}
                  <div className="bg-background rounded-2xl border border-border overflow-hidden">
                    {/* Status Ribbon */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-muted/10">
                      <div className="flex items-center gap-2">
                        <Package className={`h-4 w-4 ${config.iconColor}`} />
                        <span className={`font-semibold ${config.colorClass}`}>
                          {config.label}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {order.category === 'travel' ? '여행 포토북' : order.category === 'daily' ? '일상 포토북' : '기본 포토북'}
                      </span>
                    </div>

                    {/* Content Body (Text Only) */}
                    <div className="p-5">
                      <div className="mb-4">
                        <h3 className="font-semibold text-base text-foreground mb-1">
                          {order.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {order.start_date && order.end_date 
                            ? `기록 기간: ${order.start_date} ~ ${order.end_date}` 
                            : '전체 기간 기록'}
                        </p>
                      </div>

                      {/* Action Buttons (For testing status flow) */}
                      {order.status !== 'delivered' && (
                        <div className="mt-4 pt-4 border-t border-border border-dashed">
                          <button
                            onClick={() => handleNextStatus(order.id, order.status)}
                            className="w-full py-2.5 rounded-xl border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
                          >
                            (테스트용) 다음 상태로 변경
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}

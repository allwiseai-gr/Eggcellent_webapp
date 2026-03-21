import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import {
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import StatusBadge from '@/components/ui/StatusBadge';
import DeliveryWindowBadge from '@/components/ui/DeliveryWindowBadge';

export default function PackingList() {
  const tomorrow = addDays(new Date(), 1);
  const [selectedDate, setSelectedDate] = useState(tomorrow);
  const [showMorningOnly, setShowMorningOnly] = useState(false);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', dateStr],
    queryFn: async () => {
      const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      const allOrdersList = await base44.entities.Order.list('-delivery_date', 200);
      return allOrdersList.filter(o => {
        if (!o.delivery_date) return false;
        const deliveryDate = new Date(o.delivery_date);
        return deliveryDate >= startOfDay && deliveryDate < endOfDay;
      });
    },
  });

  const orders = allOrders.filter(order => {
    if (order.status === 'delivered') return false;
    if (showMorningOnly) {
      if (order.delivery_window === 'morning') return true;
      if (!order.delivery_window && order.delivery_date) {
        const hours = new Date(order.delivery_date).getHours();
        return hours >= 5 && hours < 12;
      }
      return false;
    }
    return true;
  });

  const { data: allOrderItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['allOrderItems'],
    queryFn: () => base44.entities.OrderItem.list(),
  });

  const isLoading = ordersLoading || itemsLoading;
  const getOrderItems = (orderId) => allOrderItems.filter(item => item.order_id === orderId);

  const aggregatedItems = {};
  orders.forEach(order => {
    getOrderItems(order.id).forEach(item => {
      const key = item.product_sku || item.product_id;
      if (!aggregatedItems[key]) {
        aggregatedItems[key] = { name: item.product_name, sku: item.product_sku, quantity: 0 };
      }
      aggregatedItems[key].quantity += item.quantity;
    });
  });

  const navigateDate = (days) => setSelectedDate(prev => addDays(prev, days));

  const getDateLabel = () => {
    if (isToday(selectedDate)) return 'Σήμερα';
    if (isTomorrow(selectedDate)) return 'Αύριο';
    return format(selectedDate, 'EEEE');
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const w = { morning: 0, noon: 1, evening: 2 };
    return (w[a.delivery_window] ?? 3) - (w[b.delivery_window] ?? 3);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Φόρτωση</h1>
          <p className="text-slate-500 text-sm mt-0.5">{getDateLabel()} • Τι να φορτώσεις</p>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="print:hidden h-10">
          <Printer className="w-4 h-4 mr-1.5" /> Εκτύπωση
        </Button>
      </div>

      {/* Date Nav */}
      <div className="flex flex-col gap-3 mb-5 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 print:hidden">
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)} className="h-12 w-12">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2 min-w-[180px] justify-center">
            <Calendar className="w-5 h-5 text-slate-400" />
            <span className="font-semibold text-slate-900 text-lg">{getDateLabel()} • {format(selectedDate, 'dd MMM')}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigateDate(1)} className="h-12 w-12">
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
        <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
          <Checkbox id="morning-only" checked={showMorningOnly} onCheckedChange={setShowMorningOnly} className="h-5 w-5" />
          <label htmlFor="morning-only" className="text-base font-medium text-slate-700 cursor-pointer">
            Μόνο πρωινές παραδόσεις
          </label>
        </div>
      </div>

      <div className="space-y-5">
        {/* Summary */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-indigo-200 bg-white/50">
            <h2 className="text-xl font-bold text-slate-900">📦 Λίστα Φόρτωσης</h2>
            <p className="text-sm text-slate-600 mt-0.5">Τι πρέπει να μπει στο αυτοκίνητο</p>
          </div>
          
          {isLoading ? (
            <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : Object.keys(aggregatedItems).length === 0 ? (
            <div className="p-8 text-center">
              {orders.length === 0 ? (
                <>
                  <p className="text-slate-700 font-medium mb-1">Δεν υπάρχουν εκκρεμείς παραδόσεις</p>
                  <p className="text-sm text-slate-500">Επιλέξτε άλλη ημερομηνία</p>
                </>
              ) : (
                <>
                  <p className="text-slate-700 font-medium mb-1">Υπάρχουν παραγγελίες χωρίς προϊόντα</p>
                  <p className="text-sm text-slate-500">Προσθέστε προϊόντα στις παραγγελίες</p>
                </>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {Object.entries(aggregatedItems).map(([key, item]) => (
                <div key={key} className="flex items-center justify-between px-5 py-4 bg-white rounded-xl shadow-sm">
                  <div>
                    <p className="font-bold text-slate-900 text-xl">{item.name}</p>
                    <code className="text-sm text-slate-500">{item.sku}</code>
                  </div>
                  <span className="text-4xl font-bold text-indigo-600">×{item.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="space-y-3">
          <div className="border-t-2 border-slate-200 pt-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
              Αναλυτικά ανά παραγγελία
            </h3>
          </div>

          {isLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
          ) : sortedOrders.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-8 text-center">
              <p className="text-slate-500">Δεν υπάρχουν παραγγελίες</p>
            </div>
          ) : (
            sortedOrders.map((order) => {
              const items = getOrderItems(order.id);
              return (
                <div key={order.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-slate-900">{order.customer_name || 'Άγνωστος'}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {order.delivery_window && <DeliveryWindowBadge window={order.delivery_window} />}
                        {order.customer_address && (
                          <span className="text-sm text-slate-600 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />{order.customer_address}
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  
                  <div className="px-5 py-4">
                    {items.length === 0 ? (
                      <p className="text-slate-500 text-sm">Χωρίς προϊόντα</p>
                    ) : (
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                <Package className="w-5 h-5 text-slate-500" />
                              </div>
                              <p className="font-semibold text-slate-900">{item.product_name}</p>
                            </div>
                            <span className="font-bold text-slate-900 text-2xl shrink-0 ml-4">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {order.delivery_notes && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-sm text-amber-800">{order.delivery_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          main, main * { visibility: visible; }
          main { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
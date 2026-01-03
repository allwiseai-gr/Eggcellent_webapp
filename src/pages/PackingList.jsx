import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, addDays, isToday, isTomorrow } from 'date-fns';
import {
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Printer,
  MapPin,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import StatusBadge from '@/components/ui/StatusBadge';
import DeliveryWindowBadge from '@/components/ui/DeliveryWindowBadge';
import EmptyState from '@/components/ui/EmptyState';

export default function PackingList() {
  // Default to tomorrow
  const tomorrow = addDays(new Date(), 1);
  const [selectedDate, setSelectedDate] = useState(tomorrow);
  const [showMorningOnly, setShowMorningOnly] = useState(false);
  const queryClient = useQueryClient();
  
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', dateStr],
    queryFn: async () => {
      const now = new Date();
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

  // Filter orders: pending only + morning filter if enabled
  const orders = allOrders.filter(order => {
    // Only show pending orders (exclude delivered)
    if (order.status === 'delivered') return false;
    
    // If morning filter is on, only show morning deliveries
    if (showMorningOnly) {
      if (order.delivery_window === 'morning') return true;
      // If no delivery_window, check time in delivery_date
      if (!order.delivery_window && order.delivery_date) {
        const deliveryDate = new Date(order.delivery_date);
        const hours = deliveryDate.getHours();
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const isLoading = ordersLoading || itemsLoading;

  // Get items for each order
  const getOrderItems = (orderId) => {
    return allOrderItems.filter(item => item.order_id === orderId);
  };

  // Aggregate all items for the day
  const aggregatedItems = {};
  orders.forEach(order => {
    const items = getOrderItems(order.id);
    items.forEach(item => {
      const key = item.product_sku || item.product_id;
      if (!aggregatedItems[key]) {
        aggregatedItems[key] = {
          name: item.product_name,
          sku: item.product_sku,
          quantity: 0,
        };
      }
      aggregatedItems[key].quantity += item.quantity;
    });
  });

  const navigateDate = (days) => {
    setSelectedDate(prev => addDays(prev, days));
  };

  const getDateLabel = () => {
    if (isToday(selectedDate)) return 'Today';
    if (isTomorrow(selectedDate)) return 'Tomorrow';
    return format(selectedDate, 'EEEE');
  };

  const handleMarkPacked = async (order) => {
    if (order.status === 'confirmed' || order.status === 'new') {
      await updateMutation.mutateAsync({ 
        id: order.id, 
        data: { status: 'packed' } 
      });
    }
  };

  // Sort orders by delivery window
  const sortedOrders = [...orders].sort((a, b) => {
    const windowOrder = { morning: 0, noon: 1, evening: 2 };
    const aOrder = windowOrder[a.delivery_window] ?? 3;
    const bOrder = windowOrder[b.delivery_window] ?? 3;
    return aOrder - bOrder;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Packing List</h1>
          <p className="text-slate-500 mt-1">
            {getDateLabel()} • What to load in the car
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={handlePrint}
          className="print:hidden"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Date Navigation */}
      <div className="flex flex-col gap-4 mb-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 print:hidden">
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)} className="h-12 w-12">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2 min-w-[180px] justify-center">
            <Calendar className="w-5 h-5 text-slate-400" />
            <span className="font-semibold text-slate-900 text-lg">
              {getDateLabel()} • {format(selectedDate, 'MMM d')}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigateDate(1)} className="h-12 w-12">
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
        
        <div className="flex flex-col gap-1 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-3">
            <Checkbox 
              id="morning-only"
              checked={showMorningOnly}
              onCheckedChange={setShowMorningOnly}
              className="h-5 w-5"
            />
            <label 
              htmlFor="morning-only" 
              className="text-base font-medium text-slate-700 cursor-pointer"
            >
              Morning deliveries only
            </label>
          </div>
          <p className="text-sm text-slate-500 ml-8">Hide noon & evening deliveries</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Aggregated Items Summary - PRIMARY FOCUS */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-indigo-200 bg-white/50">
            <h2 className="text-xl font-bold text-slate-900">📦 Load Checklist</h2>
            <p className="text-sm text-slate-600 mt-1">What to pack in the car</p>
          </div>
          
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : Object.keys(aggregatedItems).length === 0 ? (
            <div className="p-8 text-center">
              {orders.length === 0 ? (
                <>
                  <p className="text-slate-700 font-medium mb-1">No pending deliveries for this day</p>
                  <p className="text-sm text-slate-500">Select a different date to see orders</p>
                </>
              ) : (
                <>
                  <p className="text-slate-700 font-medium mb-1">Orders found, but no items added yet</p>
                  <p className="text-sm text-slate-500">Add items to orders to generate a loading summary</p>
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

        {/* Orders List - SECONDARY (verification) */}
        <div className="space-y-4">

          <div className="border-t-2 border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
              Order Details (for verification)
            </h3>
          </div>

          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))
          ) : sortedOrders.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-8 text-center">
              <p className="text-slate-500">No orders to display</p>
            </div>
          ) : (
            sortedOrders.map((order) => {
              const items = getOrderItems(order.id);
              const isPacked = order.status === 'packed' || order.status === 'out_for_delivery' || order.status === 'delivered';
              
              return (
                <div 
                 key={order.id} 
                 className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                   isPacked ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200/60'
                 }`}
                >
                 <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleMarkPacked(order)}
                        disabled={isPacked || updateMutation.isPending}
                        className="mt-1 shrink-0"
                      >
                        {isPacked ? (
                          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                        ) : (
                          <Circle className="w-7 h-7 text-slate-300 hover:text-indigo-500 transition-colors active:scale-95" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-lg ${isPacked ? 'text-emerald-900' : 'text-slate-900'}`}>
                          {order.customer_name || 'Unknown Customer'}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {order.delivery_window && (
                            <DeliveryWindowBadge window={order.delivery_window} />
                          )}
                          {order.address && (
                            <span className="text-sm text-slate-600 flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {order.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  
                  <div className="px-5 py-4">
                    {items.length === 0 ? (
                      <p className="text-slate-500 text-sm">No items</p>
                    ) : (
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                <Package className="w-5 h-5 text-slate-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 text-base">{item.product_name}</p>
                                <p className="text-xs text-slate-500">{item.product_sku}</p>
                              </div>
                            </div>
                            <span className="font-bold text-slate-900 text-2xl shrink-0 ml-4">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {order.notes && (
                      <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-sm text-amber-800">{order.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          main, main * {
            visibility: visible;
          }
          main {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
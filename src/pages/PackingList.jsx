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
  const [showMorningOnly, setShowMorningOnly] = useState(true);
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
            {getDateLabel()} {showMorningOnly ? 'Morning' : ''} • {orders.length} pending {orders.length === 1 ? 'order' : 'orders'}
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
      <div className="flex items-center justify-between gap-4 mb-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-[180px] justify-center">
            <Calendar className="w-5 h-5 text-slate-400" />
            <span className="font-semibold text-slate-900">
              {getDateLabel()} • {format(selectedDate, 'MMM d')}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigateDate(1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox 
            id="morning-only"
            checked={showMorningOnly}
            onCheckedChange={setShowMorningOnly}
          />
          <label 
            htmlFor="morning-only" 
            className="text-sm font-medium text-slate-700 cursor-pointer"
          >
            Morning Only
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aggregated Items Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden sticky top-4">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Items Summary</h2>
              <p className="text-sm text-slate-500">Total items to pack</p>
            </div>
            
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : Object.keys(aggregatedItems).length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                No items to pack
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {Object.entries(aggregatedItems).map(([key, item]) => (
                  <div key={key} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <code className="text-xs text-slate-500">{item.sku}</code>
                    </div>
                    <span className="text-lg font-bold text-indigo-600">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Orders List */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))
          ) : sortedOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
              <EmptyState
                icon={Package}
                title="No orders for this day"
                description="Select a different date to see orders"
              />
            </div>
          ) : (
            sortedOrders.map((order) => {
              const items = getOrderItems(order.id);
              const isPacked = order.status === 'packed' || order.status === 'out_for_delivery' || order.status === 'delivered';
              
              return (
                <div 
                  key={order.id} 
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                    isPacked ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200/60'
                  }`}
                >
                  <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleMarkPacked(order)}
                        disabled={isPacked || updateMutation.isPending}
                        className="mt-0.5"
                      >
                        {isPacked ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-slate-300 hover:text-indigo-500 transition-colors" />
                        )}
                      </button>
                      <div>
                        <h3 className={`font-semibold ${isPacked ? 'text-emerald-900' : 'text-slate-900'}`}>
                          {order.customer_name || 'Unknown Customer'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {order.delivery_window && (
                            <DeliveryWindowBadge window={order.delivery_window} />
                          )}
                          {order.address && (
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {order.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  
                  <div className="px-6 py-4">
                    {items.length === 0 ? (
                      <p className="text-slate-500 text-sm">No items</p>
                    ) : (
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Package className="w-4 h-4 text-slate-500" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{item.product_name}</p>
                                <p className="text-xs text-slate-500">{item.product_sku}</p>
                              </div>
                            </div>
                            <span className="font-semibold text-slate-900">×{item.quantity}</span>
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
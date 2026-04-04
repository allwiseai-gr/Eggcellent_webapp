import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, startOfMonth } from 'date-fns';
import { el } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function Reports() {
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders-reports'],
    queryFn: () => base44.entities.Order.list('-delivery_date', 500),
  });

  const { data: orderItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['orderItems-reports'],
    queryFn: () => base44.entities.OrderItem.list('-created_date', 2000),
  });

  const isLoading = loadingOrders || loadingItems;

  // Sales per product (quantity)
  const salesByProduct = useMemo(() => {
    const map = {};
    orderItems.forEach(item => {
      const name = item.product_name || item.sku || 'Άγνωστο';
      map[name] = (map[name] || 0) + (item.quantity || 0);
    });
    return Object.entries(map)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [orderItems]);

  // Revenue per month
  const revenueByMonth = useMemo(() => {
    const map = {};
    orders.forEach(order => {
      if (!order.delivery_date || !order.total_amount) return;
      const monthKey = format(startOfMonth(parseISO(order.delivery_date)), 'yyyy-MM');
      const label = format(startOfMonth(parseISO(order.delivery_date)), 'MMM yyyy', { locale: el });
      if (!map[monthKey]) map[monthKey] = { month: label, revenue: 0, orders: 0 };
      map[monthKey].revenue += order.total_amount;
      map[monthKey].orders += 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [orders]);

  // Orders per zone
  const ordersByZone = useMemo(() => {
    const map = {};
    orders.forEach(order => {
      const zone = order.customer_zone || 'Χωρίς ζώνη';
      map[zone] = (map[zone] || 0) + 1;
    });
    return Object.entries(map)
      .map(([zone, count]) => ({ zone, count }))
      .sort((a, b) => b.count - a.count);
  }, [orders]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Αναφορές</h1>
        <p className="text-slate-500 text-sm mt-0.5">Στατιστικά πωλήσεων και παραδόσεων</p>
      </div>

      <div className="space-y-6">
        {/* Sales per product */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-1">Πωλήσεις ανά Προϊόν</h2>
          <p className="text-xs text-slate-500 mb-5">Συνολικές ποσότητες που έχουν παραγγελθεί</p>
          {salesByProduct.length === 0 ? (
            <p className="text-slate-400 text-center py-12">Δεν υπάρχουν δεδομένα</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={salesByProduct} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [v, 'Τεμάχια']} />
                <Bar dataKey="quantity" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue per month */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-1">Έσοδα ανά Μήνα</h2>
          <p className="text-xs text-slate-500 mb-5">Βασίζεται σε παραγγελίες με συμπληρωμένο συνολικό ποσό</p>
          {revenueByMonth.length === 0 ? (
            <p className="text-slate-400 text-center py-12">Δεν υπάρχουν δεδομένα (χρειάζεται πεδίο "total_amount" στις παραγγελίες)</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueByMonth} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`€${v.toFixed(2)}`, 'Έσοδα']} />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders per zone */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-1">Παραγγελίες ανά Ζώνη</h2>
          <p className="text-xs text-slate-500 mb-5">Κατανομή παραδόσεων ανά περιοχή</p>
          {ordersByZone.length === 0 ? (
            <p className="text-slate-400 text-center py-12">Δεν υπάρχουν δεδομένα</p>
          ) : (
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={ordersByZone} dataKey="count" nameKey="zone" cx="50%" cy="50%" outerRadius={100} label={({ zone, percent }) => `${zone} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {ordersByZone.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Παραγγελίες']} />
                  <Legend formatter={(v) => v} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full lg:w-64 shrink-0">
                {ordersByZone.map((item, i) => (
                  <div key={item.zone} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-slate-700">{item.zone}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
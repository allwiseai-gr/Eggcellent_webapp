import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ShoppingCart, Users, Package, ArrowRight, Truck, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/ui/StatCard';
import FeaturedStatCard from '@/components/ui/FeaturedStatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import DeliveryWindowBadge from '@/components/ui/DeliveryWindowBadge';

export default function Dashboard() {
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-created_date'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ active: true }),
  });

  const isLoading = ordersLoading || customersLoading;

  const TIMEZONE = 'Europe/Athens';
  const todayString = formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowString = formatInTimeZone(tomorrowDate, TIMEZONE, 'yyyy-MM-dd');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const todayOrders = orders.filter(o => {
    if (!o.delivery_date) return false;
    const d = new Date(o.delivery_date);
    return d >= startOfToday && d < startOfTomorrow;
  });

  const deliveredToday = todayOrders.filter(o => o.status === 'delivered');
  const pendingOrders = orders.filter(o => (o.status || 'pending') !== 'delivered');
  const recentOrders = orders.slice(0, 5);

  const formatDeliveryDate = (date) => {
    if (!date) return '—';
    if (date === todayString) return 'Σήμερα';
    if (date === tomorrowString) return 'Αύριο';
    return format(parseISO(date), 'dd MMM');
  };

  const quickActions = [
    { to: createPageUrl('Orders') + '?new=true', label: 'Νέα Παραγγελία', icon: Plus, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { to: createPageUrl('Customers') + '?new=true', label: 'Νέος Πελάτης', icon: Users, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { to: createPageUrl('PackingList'), label: 'Φόρτωση', icon: Package, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { to: createPageUrl('Products'), label: 'Προϊόντα', icon: Truck, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Αρχική</h1>
        <p className="text-slate-500 mt-1">Επισκόπηση παραγγελιών</p>
      </div>

      {isLoading ? (
        <div className="space-y-3 mb-6">
          <Skeleton className="h-28 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          <Link to={createPageUrl('Orders') + '?filter=today'} className="block">
            <FeaturedStatCard title="Σημερινές" value={todayOrders.length} subtitle="Παραδόσεις σήμερα" />
          </Link>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link to={createPageUrl('Orders') + '?filter=today-delivered'}>
              <StatCard title="Παραδόθηκαν" value={`${deliveredToday.length}/${todayOrders.length}`} subtitle="Σήμερα" />
            </Link>
            <StatCard title="Εκκρεμείς" value={pendingOrders.length} subtitle="Παραγγελίες" />
            <StatCard title="Πελάτες" value={customers.length} subtitle={`${products.length} προϊόντα`} />
          </div>
        </div>
      )}

      <div className="space-y-2 mb-6">
        {quickActions.map((action) => (
          <Link key={action.label} to={action.to}>
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${action.iconBg}`}>
                <action.icon className={`w-4 h-4 ${action.iconColor}`} />
              </div>
              <span className="flex-1 text-sm font-medium text-slate-900">{action.label}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Πρόσφατες Παραγγελίες</h2>
          <Link to={createPageUrl('Orders')}>
            <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
              Όλες <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500">Δεν υπάρχουν παραγγελίες</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={createPageUrl('OrderDetail') + `?id=${order.id}`}
                className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors active:bg-slate-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{order.customer_name || 'Άγνωστος'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-500">{formatDeliveryDate(order.delivery_date)}</span>
                    {order.delivery_window && <DeliveryWindowBadge window={order.delivery_window} />}
                  </div>
                </div>
                <StatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
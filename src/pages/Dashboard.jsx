import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import {
  ShoppingCart,
  Users,
  Package,
  Clock,
  CheckCircle2,
  ArrowRight,
  Truck,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/ui/StatCard';
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
    const deliveryDate = new Date(o.delivery_date);
    return deliveryDate >= startOfToday && deliveryDate < startOfTomorrow;
  });
  
  const deliveredToday = orders.filter(o => {
    if (!o.delivery_date) return false;
    const deliveryDate = new Date(o.delivery_date);
    const isToday = deliveryDate >= startOfToday && deliveryDate < startOfTomorrow;
    return isToday && o.status === 'delivered';
  });
  
  const pendingOrders = orders.filter(o => (o.status || 'pending') !== 'delivered');
  const recentOrders = orders.slice(0, 5);

  const formatDeliveryDate = (date) => {
    if (!date) return '—';
    if (date === todayString) return 'Σήμερα';
    if (date === tomorrowString) return 'Αύριο';
    return format(parseISO(date), 'dd MMM');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Αρχική</h1>
        <p className="text-slate-500 mt-1">Επισκόπηση παραγγελιών</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <Link to={createPageUrl('Orders') + '?filter=today'}>
              <StatCard title="Σημερινές" value={todayOrders.length} icon={Clock} subtitle="Παραδόσεις" />
            </Link>
            <Link to={createPageUrl('Orders') + '?filter=today-delivered'}>
              <StatCard title="Παραδόθηκαν" value={`${deliveredToday.length}/${todayOrders.length}`} icon={CheckCircle2} subtitle="Σήμερα" />
            </Link>
            <StatCard title="Εκκρεμείς" value={pendingOrders.length} icon={Package} subtitle="Παραγγελίες" />
            <StatCard title="Πελάτες" value={customers.length} icon={Users} subtitle={`${products.length} προϊόντα`} />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link to={createPageUrl('Orders') + '?new=true'}>
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700">
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Νέα Παραγγελία</span>
          </Button>
        </Link>
        <Link to={createPageUrl('Customers') + '?new=true'}>
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Νέος Πελάτης</span>
          </Button>
        </Link>
        <Link to={createPageUrl('PackingList')}>
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700">
            <Package className="w-5 h-5" />
            <span className="text-sm font-medium">Φόρτωση</span>
          </Button>
        </Link>
        <Link to={createPageUrl('Products')}>
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700">
            <Truck className="w-5 h-5" />
            <span className="text-sm font-medium">Προϊόντα</span>
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Πρόσφατες Παραγγελίες</h2>
          <Link to={createPageUrl('Orders')}>
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
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
                  <p className="font-semibold text-slate-900 truncate">
                    {order.customer_name || 'Άγνωστος'}
                  </p>
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
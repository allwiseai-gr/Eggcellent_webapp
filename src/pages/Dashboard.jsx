import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import {
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Truck
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

  // Get today's date in Europe/Athens timezone (business timezone)
  const TIMEZONE = 'Europe/Athens';
  const todayString = formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowString = formatInTimeZone(tomorrowDate, TIMEZONE, 'yyyy-MM-dd');

  // Calculate stats - compare delivery_date strings directly
  const todayOrders = orders.filter(o => o.delivery_date === todayString);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const recentOrders = orders.slice(0, 5);

  const formatDeliveryDate = (date) => {
    if (!date) return '—';
    if (date === todayString) return 'Today';
    if (date === tomorrowString) return 'Tomorrow';
    return format(parseISO(date), 'MMM d');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your orders and business</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Today's Orders"
              value={todayOrders.length}
              icon={Clock}
              subtitle="Scheduled for today"
            />
            <StatCard
              title="Pending"
              value={pendingOrders.length}
              icon={AlertCircle}
              subtitle="To be delivered"
            />
            <StatCard
              title="Completed"
              value={completedOrders.length}
              icon={CheckCircle2}
              subtitle="Successfully delivered"
            />
            <StatCard
              title="Customers"
              value={customers.length}
              icon={Users}
              subtitle={`${products.length} products`}
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Link to={createPageUrl('Orders') + '?new=true'}>
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors">
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm font-medium">New Order</span>
          </Button>
        </Link>
        <Link to={createPageUrl('Customers') + '?new=true'}>
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">New Customer</span>
          </Button>
        </Link>
        <Link to={createPageUrl('PackingList')}>
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors">
            <Package className="w-5 h-5" />
            <span className="text-sm font-medium">Packing List</span>
          </Button>
        </Link>
        <Link to={createPageUrl('Products')}>
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-colors">
            <Truck className="w-5 h-5" />
            <span className="text-sm font-medium">Products</span>
          </Button>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent Orders</h2>
          <Link to={createPageUrl('Orders')}>
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500">No orders yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={createPageUrl('OrderDetail') + `?id=${order.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {order.customer_name || 'Unknown Customer'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-slate-500">
                      {formatDeliveryDate(order.delivery_date)}
                    </span>
                    {order.delivery_window && (
                      <DeliveryWindowBadge window={order.delivery_window} />
                    )}
                  </div>
                </div>
                <StatusBadge status={order.status} />
                <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
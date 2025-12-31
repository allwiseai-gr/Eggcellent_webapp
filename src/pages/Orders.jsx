import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import {
  Plus,
  Search,
  Filter,
  ShoppingCart,
  ArrowRight,
  Calendar,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import StatusBadge from '@/components/ui/StatusBadge';
import SourceBadge from '@/components/ui/SourceBadge';
import DeliveryWindowBadge from '@/components/ui/DeliveryWindowBadge';
import EmptyState from '@/components/ui/EmptyState';
import OrderForm from '@/components/orders/OrderForm';

export default function Orders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('tomorrow');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const queryClient = useQueryClient();

  // Check URL params for new order or filter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === 'true') {
      setShowNewOrder(true);
      window.history.replaceState({}, '', createPageUrl('Orders'));
    }
    
    // Handle filter from dashboard
    const filter = params.get('filter');
    if (filter === 'today') {
      setDateFilter('today');
      setStatusFilter('all');
    } else if (filter === 'today-delivered') {
      setDateFilter('today');
      setStatusFilter('completed');
    } else if (filter === 'today-pending') {
      setDateFilter('today');
      setStatusFilter('pending');
    }
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-delivery_date', 200),
  });

  const createOrderMutation = useMutation({
    mutationFn: (data) => base44.entities.Order.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowNewOrder(false);
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: (orderId) => base44.entities.Order.update(orderId, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // Calculate date strings in Europe/Athens timezone
  const TIMEZONE = 'Europe/Athens';
  const todayString = formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowString = formatInTimeZone(tomorrowDate, TIMEZONE, 'yyyy-MM-dd');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !search || 
        order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        order.customer_address?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    // Date filter logic
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = order.delivery_date === todayString;
    } else if (dateFilter === 'tomorrow') {
      matchesDate = order.delivery_date === tomorrowString && order.status === 'pending';
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatDeliveryDate = (date) => {
    if (!date) return '—';
    if (date === todayString) return 'Today';
    if (date === tomorrowString) return 'Tomorrow';
    return format(parseISO(date), 'MMM d, yyyy');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Orders</h1>
          <p className="text-slate-500 mt-1">{orders.length} total orders</p>
        </div>
        <Button 
          onClick={() => setShowNewOrder(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Quick Date Filters */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={dateFilter === 'today' ? 'default' : 'outline'}
          onClick={() => setDateFilter('today')}
          className={dateFilter === 'today' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Today
        </Button>
        <Button
          variant={dateFilter === 'tomorrow' ? 'default' : 'outline'}
          onClick={() => setDateFilter('tomorrow')}
          className={dateFilter === 'tomorrow' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Tomorrow
        </Button>
        <Button
          variant={dateFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setDateFilter('all')}
          className={dateFilter === 'all' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
        >
          All
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders found"
            description={search || statusFilter !== 'all' ? "Try adjusting your filters" : "Create your first order to get started"}
            action={
              !search && statusFilter === 'all' && (
                <Button onClick={() => setShowNewOrder(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Order
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivery</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0">
                          <ShoppingCart className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {order.customer_name || 'Unknown'}
                          </p>
                          {order.customer_address && (
                            <p className="text-sm text-slate-500 truncate max-w-[200px]">
                              {order.customer_address}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">
                          {formatDeliveryDate(order.delivery_date)}
                        </span>
                      </div>
                      {order.delivery_window && (
                        <DeliveryWindowBadge window={order.delivery_window} className="mt-1" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <SourceBadge source={order.source} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {order.status === 'pending' && (
                          <Button 
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              completeOrderMutation.mutate(order.id);
                            }}
                            disabled={completeOrderMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Complete
                          </Button>
                        )}
                        <Link to={createPageUrl('OrderDetail') + `?id=${order.id}`}>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-indigo-600">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Order Sheet */}
      <Sheet open={showNewOrder} onOpenChange={setShowNewOrder}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New Order</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <OrderForm 
              onSubmit={(data) => createOrderMutation.mutate(data)}
              onCancel={() => setShowNewOrder(false)}
              isLoading={createOrderMutation.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
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
  const [dateFilter, setDateFilter] = useState('all');
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
      setStatusFilter('delivered');
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
    mutationFn: async (data) => {
      // Ensure status is always 'pending' for new orders
      const { items, ...orderData } = data;
      const newOrder = await base44.entities.Order.create({ ...orderData, status: 'pending' });
      
      // Create order items if any
      if (items && items.length > 0) {
        const { data: products } = await base44.entities.Product.list();
        const itemsToCreate = items.map(item => {
          const product = products.find(p => p.id === item.product_id);
          return {
            order_id: newOrder.id,
            product_id: item.product_id,
            product_name: product?.name || '',
            sku: product?.sku || '',
            quantity: item.quantity,
            unit_price: product?.price || 0,
            total_price: (product?.price || 0) * item.quantity,
          };
        });
        await base44.entities.OrderItem.bulkCreate(itemsToCreate);
      }
      
      return newOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderItems'] });
      setShowNewOrder(false);
    },
  });

  const deliverOrderMutation = useMutation({
    mutationFn: (orderId) => base44.entities.Order.update(orderId, { status: 'delivered' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // Calculate date strings in Europe/Athens timezone for display
  const TIMEZONE = 'Europe/Athens';
  const todayString = formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowString = formatInTimeZone(tomorrowDate, TIMEZONE, 'yyyy-MM-dd');

  // Calculate start-of-day boundaries for filtering
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfDayAfterTomorrow = new Date(startOfTomorrow);
  startOfDayAfterTomorrow.setDate(startOfDayAfterTomorrow.getDate() + 1);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !search || 
        order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        order.customer_address?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    // Date filter logic using range comparisons
    let matchesDate = true;
    if (dateFilter === 'today' || dateFilter === 'tomorrow') {
      if (!order.delivery_date) {
        matchesDate = false;
      } else {
        // Parse delivery_date (handles both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm:ss" formats)
        const deliveryDate = new Date(order.delivery_date);
        
        if (dateFilter === 'today') {
          matchesDate = deliveryDate >= startOfToday && deliveryDate < startOfTomorrow;
        } else if (dateFilter === 'tomorrow') {
          matchesDate = deliveryDate >= startOfTomorrow && deliveryDate < startOfDayAfterTomorrow;
        }
      }
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
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List - Mobile Optimized Cards */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
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
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden active:scale-[0.98] transition-transform"
            >
              <Link to={createPageUrl('OrderDetail') + `?id=${order.id}`} className="block p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-slate-900 truncate">
                      {order.customer_name || 'Unknown'}
                    </h3>
                    {order.customer_address && (
                      <p className="text-sm text-slate-500 truncate mt-0.5">
                        {order.customer_address}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={order.status} className="ml-2 shrink-0" />
                </div>

                <div className="flex items-center gap-4 text-sm mb-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700 font-medium">
                      {formatDeliveryDate(order.delivery_date)}
                    </span>
                  </div>
                  {order.delivery_window && (
                    <DeliveryWindowBadge window={order.delivery_window} />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <SourceBadge source={order.source} />
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </Link>

              {order.status !== 'delivered' && (
                <div className="px-4 pb-4">
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      deliverOrderMutation.mutate(order.id);
                    }}
                    disabled={deliverOrderMutation.isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-semibold"
                  >
                    ✓ Mark as Delivered
                  </Button>
                </div>
              )}
            </div>
          ))
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
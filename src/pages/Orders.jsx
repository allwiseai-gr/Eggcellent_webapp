import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Plus, Search, ShoppingCart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === 'true') {
      setShowNewOrder(true);
      window.history.replaceState({}, '', createPageUrl('Orders'));
    }
    const filter = params.get('filter');
    if (filter === 'today') { setDateFilter('today'); setStatusFilter('all'); }
    else if (filter === 'today-delivered') { setDateFilter('today'); setStatusFilter('delivered'); }
    else if (filter === 'today-pending') { setDateFilter('today'); setStatusFilter('pending'); }
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-delivery_date', 200),
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data) => {
      const { items, ...orderData } = data;
      const newOrder = await base44.entities.Order.create({ ...orderData, status: 'pending' });
      if (items && items.length > 0) {
        const products = await base44.entities.Product.list();
        const itemsToCreate = items.map(item => {
          const product = products.find(p => p.id === item.product_id);
          return {
            order_id: newOrder.id, product_id: item.product_id,
            product_name: product?.name || '', sku: product?.sku || '',
            quantity: item.quantity, unit_price: product?.price || 0,
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); },
  });

  const TIMEZONE = 'Europe/Athens';
  const todayString = formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowString = formatInTimeZone(tomorrowDate, TIMEZONE, 'yyyy-MM-dd');

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
    let matchesDate = true;
    if (dateFilter === 'today' || dateFilter === 'tomorrow') {
      if (!order.delivery_date) { matchesDate = false; }
      else {
        const d = new Date(order.delivery_date);
        if (dateFilter === 'today') matchesDate = d >= startOfToday && d < startOfTomorrow;
        else matchesDate = d >= startOfTomorrow && d < startOfDayAfterTomorrow;
      }
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatDeliveryDate = (date) => {
    if (!date) return '—';
    if (date === todayString) return 'Σήμερα';
    if (date === tomorrowString) return 'Αύριο';
    return format(parseISO(date), 'dd MMM yyyy');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Παραγγελίες</h1>
          <p className="text-slate-500 text-sm mt-0.5">{orders.length} συνολικά</p>
        </div>
        <Button onClick={() => setShowNewOrder(true)} className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm h-11">
          <Plus className="w-5 h-5 mr-1.5" /> Νέα
        </Button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { key: 'today', label: 'Σήμερα' },
          { key: 'tomorrow', label: 'Αύριο' },
          { key: 'all', label: 'Όλες' },
        ].map(f => (
          <Button
            key={f.key}
            variant={dateFilter === f.key ? 'default' : 'outline'}
            onClick={() => setDateFilter(f.key)}
            className={`shrink-0 h-10 ${dateFilter === f.key ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
          >
            {f.key !== 'all' && <Calendar className="w-4 h-4 mr-1.5" />}
            {f.label}
          </Button>
        ))}
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Αναζήτηση..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-11"><SelectValue placeholder="Κατάσταση" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Όλες</SelectItem>
            <SelectItem value="pending">Εκκρεμείς</SelectItem>
            <SelectItem value="delivered">Παραδόθηκαν</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
            <EmptyState
              icon={ShoppingCart}
              title="Δεν βρέθηκαν παραγγελίες"
              description={search || statusFilter !== 'all' ? "Δοκιμάστε διαφορετικά φίλτρα" : "Δημιουργήστε την πρώτη παραγγελία"}
              action={!search && statusFilter === 'all' && (
                <Button onClick={() => setShowNewOrder(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" /> Νέα Παραγγελία
                </Button>
              )}
            />
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden active:scale-[0.98] transition-transform border-l-4", order.status === 'delivered' ? "border-l-emerald-500" : "border-l-amber-400")}>
              <Link to={createPageUrl('OrderDetail') + `?id=${order.id}`} className="block p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-slate-900 truncate">{order.customer_name || 'Άγνωστος'}</h3>
                    {order.customer_address && <p className="text-sm text-slate-500 truncate mt-0.5">{order.customer_address}</p>}
                  </div>
                  <StatusBadge status={order.status} className="ml-2 shrink-0" />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700 font-medium">{formatDeliveryDate(order.delivery_date)}</span>
                  </div>
                  {order.delivery_window && <DeliveryWindowBadge window={order.delivery_window} />}
                  <SourceBadge source={order.source} />
                </div>
              </Link>
              {order.status !== 'delivered' && (
                <div className="px-4 pb-4">
                  <Button
                    onClick={() => deliverOrderMutation.mutate(order.id)}
                    disabled={deliverOrderMutation.isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-semibold"
                  >
                    ✓ Παραδόθηκε
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Sheet open={showNewOrder} onOpenChange={setShowNewOrder}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Νέα Παραγγελία</SheetTitle></SheetHeader>
          <div className="mt-6">
            <OrderForm onSubmit={(data) => createOrderMutation.mutate(data)} onCancel={() => setShowNewOrder(false)} isLoading={createOrderMutation.isPending} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
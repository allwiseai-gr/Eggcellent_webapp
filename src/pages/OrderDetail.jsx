import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft, Calendar, MapPin, CreditCard, MessageSquare,
  User, Package, Edit2, Trash2, Loader2, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import StatusBadge from '@/components/ui/StatusBadge';
import SourceBadge from '@/components/ui/SourceBadge';
import DeliveryWindowBadge from '@/components/ui/DeliveryWindowBadge';

function InfoRow({ icon: Icon, label, value, extra }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-slate-600" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        {typeof value === 'string' ? <p className="font-medium text-slate-900">{value}</p> : value}
        {extra}
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => base44.entities.Order.filter({ id: orderId }).then(res => res[0]),
    enabled: !!orderId,
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ['orderItems', orderId],
    queryFn: () => base44.entities.OrderItem.filter({ order_id: orderId }),
    enabled: !!orderId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Order.update(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setEditingNotes(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Order.delete(orderId),
    onSuccess: () => { window.location.href = createPageUrl('Orders'); },
  });

  const paymentLabels = { cash: 'Μετρητά', card: 'Κάρτα', transfer: 'Μεταφορά', unknown: 'Άγνωστο' };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 rounded-2xl mb-6" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto text-center py-16">
        <p className="text-slate-500">Η παραγγελία δεν βρέθηκε</p>
        <Link to={createPageUrl('Orders')}><Button className="mt-4">Πίσω</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link to={createPageUrl('Orders')}>
          <Button variant="ghost" size="icon" className="shrink-0 h-11 w-11"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{order.customer_name || 'Παραγγελία'}</h1>
          <p className="text-slate-500 text-sm">{format(parseISO(order.created_date), 'dd MMM yyyy')}</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => setShowDeleteDialog(true)} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-11 w-11">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Κατάσταση</h2>
          <StatusBadge status={order.status} />
        </div>
        {order.status === 'pending' ? (
          <Button
            onClick={() => updateMutation.mutate({ status: 'delivered' })}
            disabled={updateMutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 text-lg font-semibold"
          >
            {updateMutation.isPending ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <Check className="w-6 h-6 mr-2" />}
            Παραδόθηκε
          </Button>
        ) : (
          <div className="text-center py-4 bg-emerald-50 rounded-xl text-emerald-700 font-semibold text-lg">✓ Παραδόθηκε</div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 mb-4">
        <h2 className="font-semibold text-slate-900 mb-4">Στοιχεία</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={Calendar} label="Παράδοση" value={order.delivery_date ? format(parseISO(order.delivery_date), 'dd MMM yyyy') : '—'} extra={order.delivery_window && <DeliveryWindowBadge window={order.delivery_window} className="mt-1" />} />
          <InfoRow icon={MapPin} label="Διεύθυνση" value={order.customer_address || '—'} />
          <InfoRow icon={CreditCard} label="Πληρωμή" value={paymentLabels[order.payment_method] || '—'} />
          <InfoRow icon={MessageSquare} label="Πηγή" value={<SourceBadge source={order.source} />} />
          {order.customer_id && (
            <div className="flex items-start gap-3 sm:col-span-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><User className="w-5 h-5 text-slate-600" /></div>
              <div>
                <p className="text-sm text-slate-500">Πελάτης</p>
                <Link to={createPageUrl('CustomerDetail') + `?id=${order.customer_id}`} className="font-medium text-indigo-600">{order.customer_name || 'Προβολή'}</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 mb-4">
        <h2 className="font-semibold text-slate-900 mb-4">Προϊόντα</h2>
        {orderItems.length === 0 ? (
          <p className="text-slate-500 text-center py-6">Χωρίς προϊόντα</p>
        ) : (
          <div className="space-y-3">
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shrink-0 border">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-lg">{item.product_name || item.sku}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-900 text-2xl">×{item.quantity}</p>
                  {item.unit_price > 0 && <p className="text-sm text-slate-500">€{item.total_price?.toFixed(2)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Σημειώσεις</h2>
          {!editingNotes && (
            <Button variant="ghost" size="sm" onClick={() => { setNotes(order.delivery_notes || ''); setEditingNotes(true); }}>
              <Edit2 className="w-4 h-4 mr-1" /> Επεξεργασία
            </Button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-3">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Σημειώσεις..." rows={4} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingNotes(false)} className="flex-1">Ακύρωση</Button>
              <Button onClick={() => updateMutation.mutate({ delivery_notes: notes })} disabled={updateMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Αποθήκευση
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-slate-600 whitespace-pre-wrap">{order.delivery_notes || 'Χωρίς σημειώσεις'}</p>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Διαγραφή Παραγγελίας</AlertDialogTitle>
            <AlertDialogDescription>Είστε σίγουροι; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
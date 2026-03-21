import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Phone, MapPin, MessageCircle, Edit2, Trash2, Loader2, ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import StatusBadge from '@/components/ui/StatusBadge';
import CustomerForm from '@/components/customers/CustomerForm';

export default function CustomerDetail() {
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const customerId = urlParams.get('id');
  const queryClient = useQueryClient();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => base44.entities.Customer.filter({ id: customerId }).then(res => res[0]),
    enabled: !!customerId,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['customerOrders', customerId],
    queryFn: () => base44.entities.Order.filter({ customer_id: customerId }),
    enabled: !!customerId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Customer.update(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowEditSheet(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Customer.delete(customerId),
    onSuccess: () => { window.location.href = createPageUrl('Customers'); },
  });

  if (isLoading) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 rounded-2xl mb-6" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-4 max-w-4xl mx-auto text-center py-16">
        <p className="text-slate-500">Ο πελάτης δεν βρέθηκε</p>
        <Link to={createPageUrl('Customers')}><Button className="mt-4">Πίσω</Button></Link>
      </div>
    );
  }

  const channelItems = [
    { id: 'messenger', label: 'Messenger', value: customer.messenger_id, bg: 'bg-blue-50', text: 'text-blue-700' },
    { id: 'viber', label: 'Viber', value: customer.viber_id, bg: 'bg-purple-50', text: 'text-purple-700' },
    { id: 'whatsapp', label: 'WhatsApp', value: customer.whatsapp_id, bg: 'bg-green-50', text: 'text-green-700' },
    { id: 'telegram', label: 'Telegram', value: customer.telegram_id, bg: 'bg-sky-50', text: 'text-sky-700' },
  ].filter(c => c.value);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link to={createPageUrl('Customers')}>
          <Button variant="ghost" size="icon" className="shrink-0 h-11 w-11"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{customer.name}</h1>
          <p className="text-slate-500 text-sm">Πελάτης από {format(parseISO(customer.created_date), 'MMM yyyy')}</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => setShowEditSheet(true)} className="h-11 w-11">
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setShowDeleteDialog(true)} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-11 w-11">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 mb-4">
        <h2 className="font-semibold text-slate-900 mb-4">Στοιχεία Επικοινωνίας</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><Phone className="w-5 h-5 text-slate-600" /></div>
            <div><p className="text-sm text-slate-500">Τηλέφωνο</p><p className="font-medium text-slate-900">{customer.phone || '—'}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 text-slate-600" /></div>
            <div><p className="text-sm text-slate-500">Διεύθυνση</p><p className="font-medium text-slate-900">{customer.address || '—'}</p></div>
          </div>
          {customer.zone && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 text-slate-600" /></div>
              <div><p className="text-sm text-slate-500">Ζώνη</p><p className="font-medium text-slate-900">{customer.zone}</p></div>
            </div>
          )}
        </div>

        {channelItems.length > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Κανάλια Επικοινωνίας</h3>
            <div className="flex flex-wrap gap-2">
              {channelItems.map(ch => (
                <div key={ch.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${ch.bg} ${ch.text}`}>
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{ch.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {customer.notes && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Σημειώσεις</h3>
            <p className="text-slate-600 whitespace-pre-wrap">{customer.notes}</p>
          </div>
        )}
      </div>

      {/* Orders */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Παραγγελίες ({orders.length})</h2>
          <Link to={createPageUrl('Orders') + '?new=true'}>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Νέα</Button>
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Χωρίς παραγγελίες</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link key={order.id} to={createPageUrl('OrderDetail') + `?id=${order.id}`}
                className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors active:bg-slate-200">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{order.delivery_date ? format(parseISO(order.delivery_date), 'dd MMM yyyy') : 'Χωρίς ημερομηνία'}</p>
                  <p className="text-sm text-slate-500 truncate">{order.customer_address || 'Χωρίς διεύθυνση'}</p>
                </div>
                <StatusBadge status={order.status} />
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            ))}
          </div>
        )}
      </div>

      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Επεξεργασία Πελάτη</SheetTitle></SheetHeader>
          <div className="mt-6">
            <CustomerForm customer={customer} onSubmit={(data) => updateMutation.mutate(data)} onCancel={() => setShowEditSheet(false)} isLoading={updateMutation.isPending} />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Διαγραφή Πελάτη</AlertDialogTitle>
            <AlertDialogDescription>Είστε σίγουροι; Οι παραγγελίες δεν θα διαγραφούν.</AlertDialogDescription>
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
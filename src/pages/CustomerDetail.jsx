import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Phone,
  MapPin,
  MessageCircle,
  Edit2,
  Trash2,
  Loader2,
  ShoppingCart,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
    onSuccess: () => {
      window.location.href = createPageUrl('Customers');
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 rounded-2xl mb-6" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto text-center py-16">
        <p className="text-slate-500">Customer not found</p>
        <Link to={createPageUrl('Customers')}>
          <Button className="mt-4">Back to Customers</Button>
        </Link>
      </div>
    );
  }

  const channelItems = [
    { id: 'messenger', label: 'Messenger', value: customer.messenger_id, color: 'blue' },
    { id: 'viber', label: 'Viber', value: customer.viber_id, color: 'purple' },
    { id: 'whatsapp', label: 'WhatsApp', value: customer.whatsapp_id, color: 'green' },
    { id: 'telegram', label: 'Telegram', value: customer.telegram_id, color: 'sky' },
  ].filter(c => c.value);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={createPageUrl('Customers')}>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
          <p className="text-slate-500 text-sm">
            Customer since {format(parseISO(customer.created_date), 'MMMM yyyy')}
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={() => setShowEditSheet(true)}
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setShowDeleteDialog(true)}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Contact Information</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Phone</p>
              <p className="font-medium text-slate-900">{customer.phone || '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Zone</p>
              <p className="font-medium text-slate-900">{customer.zone || '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Address</p>
              <p className="font-medium text-slate-900">{customer.address || '—'}</p>
            </div>
          </div>
        </div>

        {/* Messaging Channels */}
        {channelItems.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Messaging Channels</h3>
            <div className="flex flex-wrap gap-2">
              {channelItems.map(channel => (
                <div 
                  key={channel.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-${channel.color}-50 text-${channel.color}-700`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{channel.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {customer.notes && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Notes</h3>
            <p className="text-slate-600 whitespace-pre-wrap">{customer.notes}</p>
          </div>
        )}
      </div>

      {/* Orders */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Orders ({orders.length})</h2>
          <Link to={createPageUrl('Orders') + '?new=true'}>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              New Order
            </Button>
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No orders yet</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={createPageUrl('OrderDetail') + `?id=${order.id}`}
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border">
                  <ShoppingCart className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">
                    {order.delivery_date ? format(parseISO(order.delivery_date), 'PPP') : 'No date'}
                  </p>
                  <p className="text-sm text-slate-500 truncate">
                    {order.address || 'No address'}
                  </p>
                </div>
                <StatusBadge status={order.status} />
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Edit Sheet */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Customer</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <CustomerForm 
              customer={customer}
              onSubmit={(data) => updateMutation.mutate(data)}
              onCancel={() => setShowEditSheet(false)}
              isLoading={updateMutation.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {customer.name}? This will not delete their orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
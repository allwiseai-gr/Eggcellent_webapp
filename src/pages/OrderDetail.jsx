import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CreditCard,
  MessageSquare,
  User,
  Package,
  Edit2,
  Trash2,
  Loader2,
  Check,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import SourceBadge from '@/components/ui/SourceBadge';
import DeliveryWindowBadge from '@/components/ui/DeliveryWindowBadge';

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
    onSuccess: () => {
      window.location.href = createPageUrl('Orders');
    },
  });

  const handleStatusChange = (newStatus) => {
    updateMutation.mutate({ status: newStatus });
  };

  const handleSaveNotes = () => {
    updateMutation.mutate({ notes });
  };

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
        <p className="text-slate-500">Order not found</p>
        <Link to={createPageUrl('Orders')}>
          <Button className="mt-4">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={createPageUrl('Orders')}>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {order.customer_name || 'Order Details'}
          </h1>
          <p className="text-slate-500 text-sm">
            Created {format(parseISO(order.created_date), 'PPP')}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setShowDeleteDialog(true)}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Status & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Status</h2>
          <StatusBadge status={order.status} />
        </div>
        
        <div className="flex gap-3">
          {order.status === 'pending' && (
            <Button
              onClick={() => handleStatusChange('delivered')}
              disabled={updateMutation.isPending}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-14 text-lg font-semibold"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              ) : (
                <Check className="w-6 h-6 mr-2" />
              )}
              Mark as Delivered
            </Button>
          )}
          {order.status === 'delivered' && (
            <div className="flex-1 text-center py-4 bg-emerald-50 rounded-xl text-emerald-700 font-semibold text-lg">
              ✓ Order delivered
            </div>
          )}
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Order Information</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Delivery</p>
              <p className="font-medium text-slate-900">
                {order.delivery_date ? format(parseISO(order.delivery_date), 'PPP') : '—'}
              </p>
              {order.delivery_window && (
                <DeliveryWindowBadge window={order.delivery_window} className="mt-1" />
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Address</p>
              <p className="font-medium text-slate-900">{order.customer_address || '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Payment</p>
              <p className="font-medium text-slate-900 capitalize">{order.payment_method || '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Source</p>
              <SourceBadge source={order.source} />
            </div>
          </div>

          {order.customer_id && (
            <div className="flex items-start gap-3 sm:col-span-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Customer</p>
                <Link 
                  to={createPageUrl('CustomerDetail') + `?id=${order.customer_id}`}
                  className="font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {order.customer_name || 'View Customer'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Items</h2>
        
        {orderItems.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No items in this order</p>
        ) : (
          <div className="space-y-3">
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shrink-0 border">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-lg">{item.product_name || item.sku}</p>
                  {item.sku && <p className="text-sm text-slate-500">{item.sku}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-900 text-2xl">×{item.quantity}</p>
                  {item.unit_price && (
                    <p className="text-sm text-slate-500">€{item.total_price?.toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Notes</h2>
          {!editingNotes && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setNotes(order.notes || '');
                setEditingNotes(true);
              }}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
        
        {editingNotes ? (
          <div className="space-y-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              rows={4}
            />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setEditingNotes(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveNotes}
                disabled={updateMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-slate-600 whitespace-pre-wrap">
            {order.notes || 'No notes added'}
          </p>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
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
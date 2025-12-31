import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OrderForm({ order, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    customer_id: order?.customer_id || '',
    customer_name: order?.customer_name || '',
    delivery_date: order?.delivery_date || '',
    delivery_window: order?.delivery_window || '',
    payment_method: order?.payment_method || 'unknown',
    source: order?.source || 'manual',
    status: order?.status || 'pending',
    address: order?.address || '',
    notes: order?.notes || '',
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('name'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ active: true }),
  });

  // Find 6-pack and 30-pack products
  const product6 = products.find(p => p.sku === 'EGGS_6' || p.name?.includes('6'));
  const product30 = products.find(p => p.sku === 'EGGS_30' || p.name?.includes('30'));

  const [items, setItems] = useState(() => {
    if (order?.items) return order.items;
    return [
      { product_id: product6?.id || '', quantity: 0 },
      { product_id: product30?.id || '', quantity: 0 }
    ];
  });

  // Update items when products load
  React.useEffect(() => {
    if (products.length > 0 && !order) {
      setItems([
        { product_id: product6?.id || '', quantity: 0 },
        { product_id: product30?.id || '', quantity: 0 }
      ]);
    }
  }, [products, product6?.id, product30?.id, order]);

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      customer_name: customer?.name || '',
      address: customer?.address || prev.address,
    }));
  };

  const handleQuantityChange = (index, quantity) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity: parseInt(quantity) || 0 } : item
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Only include items with quantity > 0
    const validItems = items.filter(item => item.quantity > 0 && item.product_id);
    onSubmit({ ...formData, items: validItems });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer */}
      <div className="space-y-2">
        <Label>Customer</Label>
        <Select 
          value={formData.customer_id} 
          onValueChange={handleCustomerChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map(customer => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Delivery Date & Window */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Delivery Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.delivery_date && "text-slate-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.delivery_date 
                  ? format(new Date(formData.delivery_date), "PPP")
                  : "Pick a date"
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.delivery_date ? new Date(formData.delivery_date) : undefined}
                onSelect={(date) => setFormData(prev => ({
                  ...prev,
                  delivery_date: date ? format(date, 'yyyy-MM-dd') : ''
                }))}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Time Window</Label>
          <Select 
            value={formData.delivery_window} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, delivery_window: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select window" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="noon">Noon</SelectItem>
              <SelectItem value="evening">Evening</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label>Delivery Address</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder="Enter address"
        />
      </div>

      {/* Source & Payment */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Source</Label>
          <Select 
            value={formData.source} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, source: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="messenger">Messenger</SelectItem>
              <SelectItem value="viber">Viber</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="telegram">Telegram</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Payment</Label>
          <Select 
            value={formData.payment_method} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, payment_method: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unknown">Unknown</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Order Items */}
      <div className="space-y-3">
        <Label>Προϊόντα</Label>
        
        <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
          {/* 6-pack */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-medium text-slate-900">{product6?.name || 'Αυγά 6τμχ'}</p>
              <p className="text-xs text-slate-500">{product6?.sku}</p>
            </div>
            <Input
              type="number"
              min="0"
              value={items[0]?.quantity || 0}
              onChange={(e) => handleQuantityChange(0, e.target.value)}
              className="w-24 text-center"
              placeholder="0"
            />
          </div>

          {/* 30-pack */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-medium text-slate-900">{product30?.name || 'Αυγά 30τμχ'}</p>
              <p className="text-xs text-slate-500">{product30?.sku}</p>
            </div>
            <Input
              type="number"
              min="0"
              value={items[1]?.quantity || 0}
              onChange={(e) => handleQuantityChange(1, e.target.value)}
              className="w-24 text-center"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any special instructions..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!formData.customer_id || isLoading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {order ? 'Update Order' : 'Create Order'}
        </Button>
      </div>
    </form>
  );
}
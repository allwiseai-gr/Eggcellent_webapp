import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
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
    customer_address: order?.customer_address || '',
    delivery_notes: order?.delivery_notes || '',
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('name'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ active: true }),
  });

  const product6 = products.find(p => p.sku === 'EGGS_6' || p.name?.includes('6'));
  const product30 = products.find(p => p.sku === 'EGGS_30' || p.name?.includes('30'));

  const [items, setItems] = useState([
    { product_id: '', quantity: 0 },
    { product_id: '', quantity: 0 }
  ]);

  React.useEffect(() => {
    if (products.length > 0 && !order && product6 && product30) {
      setItems(prev => [
        { ...prev[0], product_id: product6.id },
        { ...prev[1], product_id: product30.id }
      ]);
    }
  }, [products.length, product6?.id, product30?.id, order]);

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      customer_name: customer?.name || '',
      customer_address: customer?.address || prev.customer_address,
    }));
  };

  const handleQuantityChange = (index, quantity) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: parseInt(quantity) || 0 } : item));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validItems = items.filter(item => item.quantity > 0 && item.product_id);
    onSubmit({ ...formData, items: validItems });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Πελάτης</Label>
        <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
          <SelectTrigger className="h-11"><SelectValue placeholder="Επιλογή πελάτη" /></SelectTrigger>
          <SelectContent>
            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Ημερομηνία</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-11", !formData.delivery_date && "text-slate-500")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.delivery_date ? format(new Date(formData.delivery_date), "dd/MM/yy") : "Επιλογή"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={formData.delivery_date ? new Date(formData.delivery_date) : undefined}
                onSelect={(date) => setFormData(prev => ({ ...prev, delivery_date: date ? format(date, 'yyyy-MM-dd') : '' }))} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>Ώρα</Label>
          <Select value={formData.delivery_window} onValueChange={(v) => setFormData(prev => ({ ...prev, delivery_window: v }))}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Επιλογή" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Πρωί</SelectItem>
              <SelectItem value="noon">Μεσημέρι</SelectItem>
              <SelectItem value="evening">Βράδυ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Διεύθυνση</Label>
        <Input value={formData.customer_address} onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))} placeholder="Διεύθυνση παράδοσης" className="h-11" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Πηγή</Label>
          <Select value={formData.source} onValueChange={(v) => setFormData(prev => ({ ...prev, source: v }))}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Χειροκίνητα</SelectItem>
              <SelectItem value="phone">Τηλέφωνο</SelectItem>
              <SelectItem value="messenger">Messenger</SelectItem>
              <SelectItem value="viber">Viber</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="telegram">Telegram</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Πληρωμή</Label>
          <Select value={formData.payment_method} onValueChange={(v) => setFormData(prev => ({ ...prev, payment_method: v }))}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unknown">Άγνωστο</SelectItem>
              <SelectItem value="cash">Μετρητά</SelectItem>
              <SelectItem value="card">Κάρτα</SelectItem>
              <SelectItem value="transfer">Μεταφορά</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products */}
      <div className="space-y-2">
        <Label>Προϊόντα</Label>
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-medium text-slate-900">{product6?.name || 'Αυγά 6τμχ'}</p>
            </div>
            <Input type="number" min="0" value={items[0]?.quantity || 0} onChange={(e) => handleQuantityChange(0, e.target.value)} className="w-24 text-center h-11 text-lg font-semibold" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-medium text-slate-900">{product30?.name || 'Αυγά 30τμχ'}</p>
            </div>
            <Input type="number" min="0" value={items[1]?.quantity || 0} onChange={(e) => handleQuantityChange(1, e.target.value)} className="w-24 text-center h-11 text-lg font-semibold" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Σημειώσεις</Label>
        <Textarea value={formData.delivery_notes} onChange={(e) => setFormData(prev => ({ ...prev, delivery_notes: e.target.value }))} placeholder="Οδηγίες παράδοσης..." rows={3} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12">Ακύρωση</Button>
        <Button type="submit" disabled={!formData.customer_id || isLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-semibold">
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {order ? 'Ενημέρωση' : 'Δημιουργία'}
        </Button>
      </div>
    </form>
  );
}
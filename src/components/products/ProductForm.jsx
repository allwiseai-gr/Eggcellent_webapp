import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

export default function ProductForm({ product, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    unit: product?.unit || '',
    price: product?.price || '',
    active: product?.active !== false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, price: formData.price ? parseFloat(formData.price) : null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Όνομα Προϊόντος *</Label>
        <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="π.χ. Αυγά 30τμχ" required className="h-11" />
      </div>
      <div className="space-y-2">
        <Label>Κωδικός (SKU) *</Label>
        <Input value={formData.sku} onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} placeholder="π.χ. EGGS_30" required className="h-11" />
        <p className="text-xs text-slate-500">Μοναδικός κωδικός προϊόντος</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Μονάδα</Label>
          <Input value={formData.unit} onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))} placeholder="π.χ. τεμ, κιλό" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label>Τιμή (€)</Label>
          <Input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} placeholder="0.00" className="h-11" />
        </div>
      </div>
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
        <div>
          <Label className="text-base">Ενεργό</Label>
          <p className="text-sm text-slate-500">Διαθέσιμο για παραγγελίες</p>
        </div>
        <Switch checked={formData.active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12">Ακύρωση</Button>
        <Button type="submit" disabled={!formData.name || !formData.sku || isLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-semibold">
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {product ? 'Ενημέρωση' : 'Δημιουργία'}
        </Button>
      </div>
    </form>
  );
}
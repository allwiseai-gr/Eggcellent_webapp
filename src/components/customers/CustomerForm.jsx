import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export default function CustomerForm({ customer, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    zone: customer?.zone || '',
    messenger_id: customer?.messenger_id || '',
    viber_id: customer?.viber_id || '',
    whatsapp_id: customer?.whatsapp_id || '',
    telegram_id: customer?.telegram_id || '',
    notes: customer?.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Όνομα *</Label>
        <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Ονοματεπώνυμο" required className="h-11" />
      </div>
      <div className="space-y-2">
        <Label>Τηλέφωνο</Label>
        <Input value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="+30 6XX XXX XXXX" className="h-11" />
      </div>
      <div className="space-y-2">
        <Label>Διεύθυνση</Label>
        <Input value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} placeholder="Διεύθυνση παράδοσης" className="h-11" />
      </div>
      <div className="space-y-2">
        <Label>Ζώνη / Περιοχή</Label>
        <Input value={formData.zone} onChange={(e) => setFormData(prev => ({ ...prev, zone: e.target.value }))} placeholder="Περιοχή παράδοσης" className="h-11" />
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-700 border-b pb-2">Κανάλια Επικοινωνίας</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Messenger</Label>
            <Input value={formData.messenger_id} onChange={(e) => setFormData(prev => ({ ...prev, messenger_id: e.target.value }))} placeholder="ID" className="text-sm h-10" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Viber</Label>
            <Input value={formData.viber_id} onChange={(e) => setFormData(prev => ({ ...prev, viber_id: e.target.value }))} placeholder="ID" className="text-sm h-10" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">WhatsApp</Label>
            <Input value={formData.whatsapp_id} onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_id: e.target.value }))} placeholder="ID" className="text-sm h-10" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Telegram</Label>
            <Input value={formData.telegram_id} onChange={(e) => setFormData(prev => ({ ...prev, telegram_id: e.target.value }))} placeholder="ID" className="text-sm h-10" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Σημειώσεις</Label>
        <Textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Επιπλέον σημειώσεις..." rows={3} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12">Ακύρωση</Button>
        <Button type="submit" disabled={!formData.name || isLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-semibold">
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {customer ? 'Ενημέρωση' : 'Δημιουργία'}
        </Button>
      </div>
    </form>
  );
}
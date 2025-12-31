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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Customer name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+30 6XX XXX XXXX"
          />
        </div>

        <div className="space-y-2">
          <Label>Address</Label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Delivery address"
          />
        </div>

        <div className="space-y-2">
          <Label>Zone / Area</Label>
          <Input
            value={formData.zone}
            onChange={(e) => setFormData(prev => ({ ...prev, zone: e.target.value }))}
            placeholder="Delivery zone"
          />
        </div>
      </div>

      {/* Messenger IDs */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-700 border-b pb-2">Messaging Channels</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Messenger ID</Label>
            <Input
              value={formData.messenger_id}
              onChange={(e) => setFormData(prev => ({ ...prev, messenger_id: e.target.value }))}
              placeholder="FB Messenger"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Viber ID</Label>
            <Input
              value={formData.viber_id}
              onChange={(e) => setFormData(prev => ({ ...prev, viber_id: e.target.value }))}
              placeholder="Viber"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">WhatsApp ID</Label>
            <Input
              value={formData.whatsapp_id}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_id: e.target.value }))}
              placeholder="WhatsApp"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Telegram ID</Label>
            <Input
              value={formData.telegram_id}
              onChange={(e) => setFormData(prev => ({ ...prev, telegram_id: e.target.value }))}
              placeholder="Telegram"
              className="text-sm"
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
          placeholder="Additional notes..."
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
          disabled={!formData.name || isLoading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {customer ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Plus,
  Search,
  Users,
  Phone,
  MapPin,
  ArrowRight,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import EmptyState from '@/components/ui/EmptyState';
import CustomerForm from '@/components/customers/CustomerForm';

export default function Customers() {
  const [search, setSearch] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === 'true') {
      setShowNewCustomer(true);
      window.history.replaceState({}, '', createPageUrl('Customers'));
    }
  }, []);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Customer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowNewCustomer(false);
    },
  });

  const filteredCustomers = customers.filter(customer => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(search) ||
      customer.zone?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Customers</h1>
          <p className="text-slate-500 mt-1">{customers.length} total customers</p>
        </div>
        <Button 
          onClick={() => setShowNewCustomer(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description={search ? "Try a different search term" : "Add your first customer to get started"}
            action={
              !search && (
                <Button onClick={() => setShowNewCustomer(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Customer
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Zone</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Channels</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-emerald-700">
                            {customer.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{customer.name}</p>
                          {customer.address && (
                            <p className="text-sm text-slate-500 truncate max-w-[200px]">
                              {customer.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{customer.phone}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {customer.zone ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{customer.zone}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {customer.messenger_id && (
                          <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center" title="Messenger">
                            <MessageCircle className="w-3 h-3 text-blue-600" />
                          </div>
                        )}
                        {customer.viber_id && (
                          <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center" title="Viber">
                            <MessageCircle className="w-3 h-3 text-purple-600" />
                          </div>
                        )}
                        {customer.whatsapp_id && (
                          <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center" title="WhatsApp">
                            <MessageCircle className="w-3 h-3 text-green-600" />
                          </div>
                        )}
                        {customer.telegram_id && (
                          <div className="w-6 h-6 rounded bg-sky-100 flex items-center justify-center" title="Telegram">
                            <MessageCircle className="w-3 h-3 text-sky-600" />
                          </div>
                        )}
                        {!customer.messenger_id && !customer.viber_id && !customer.whatsapp_id && !customer.telegram_id && (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={createPageUrl('CustomerDetail') + `?id=${customer.id}`}>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-indigo-600">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Customer Sheet */}
      <Sheet open={showNewCustomer} onOpenChange={setShowNewCustomer}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New Customer</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <CustomerForm 
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setShowNewCustomer(false)}
              isLoading={createMutation.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
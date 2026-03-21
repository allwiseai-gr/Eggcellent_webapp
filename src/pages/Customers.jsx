import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Search, Users, Phone, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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

  const filteredCustomers = customers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.name?.toLowerCase().includes(s) || c.phone?.includes(search) || c.zone?.toLowerCase().includes(s);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Πελάτες</h1>
          <p className="text-slate-500 text-sm mt-0.5">{customers.length} συνολικά</p>
        </div>
        <Button onClick={() => setShowNewCustomer(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-11">
          <Plus className="w-5 h-5 mr-1.5" /> Νέος
        </Button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Αναζήτηση πελάτη..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
            <EmptyState
              icon={Users}
              title="Δεν βρέθηκαν πελάτες"
              description={search ? "Δοκιμάστε διαφορετική αναζήτηση" : "Προσθέστε τον πρώτο πελάτη"}
              action={!search && (
                <Button onClick={() => setShowNewCustomer(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" /> Νέος Πελάτης
                </Button>
              )}
            />
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <Link
              key={customer.id}
              to={createPageUrl('CustomerDetail') + `?id=${customer.id}`}
              className="block bg-white rounded-xl border border-slate-200 shadow-sm p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shrink-0">
                  <span className="text-base font-semibold text-emerald-700">{customer.name?.charAt(0) || '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-base truncate">{customer.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    {customer.phone && (
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{customer.phone}</span>
                    )}
                    {customer.zone && (
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{customer.zone}</span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" />
              </div>
            </Link>
          ))
        )}
      </div>

      <Sheet open={showNewCustomer} onOpenChange={setShowNewCustomer}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Νέος Πελάτης</SheetTitle></SheetHeader>
          <div className="mt-6">
            <CustomerForm onSubmit={(data) => createMutation.mutate(data)} onCancel={() => setShowNewCustomer(false)} isLoading={createMutation.isPending} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
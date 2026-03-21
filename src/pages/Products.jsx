import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Package, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import EmptyState from '@/components/ui/EmptyState';
import ProductForm from '@/components/products/ProductForm';

export default function Products() {
  const [search, setSearch] = useState('');
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['allProducts'],
    queryFn: () => base44.entities.Product.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allProducts'] }); setShowNewProduct(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allProducts'] }); setEditingProduct(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allProducts'] }); setDeletingProduct(null); },
  });

  const handleToggleActive = async (product) => {
    await updateMutation.mutateAsync({ id: product.id, data: { active: !product.active } });
  };

  const filteredProducts = products.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.name?.toLowerCase().includes(s) || p.sku?.toLowerCase().includes(s);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Προϊόντα</h1>
          <p className="text-slate-500 text-sm mt-0.5">{products.length} συνολικά</p>
        </div>
        <Button onClick={() => setShowNewProduct(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-11">
          <Plus className="w-5 h-5 mr-1.5" /> Νέο
        </Button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Αναζήτηση προϊόντος..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
            <EmptyState
              icon={Package}
              title="Δεν βρέθηκαν προϊόντα"
              description={search ? "Δοκιμάστε διαφορετική αναζήτηση" : "Προσθέστε το πρώτο προϊόν"}
              action={!search && (
                <Button onClick={() => setShowNewProduct(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" /> Νέο Προϊόν
                </Button>
              )}
            />
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-base">{product.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{product.sku}</code>
                    {product.price > 0 && <span className="text-sm text-slate-500">€{product.price.toFixed(2)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={product.active !== false} onCheckedChange={() => handleToggleActive(product)} />
                  <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)} className="text-slate-400 hover:text-indigo-600 h-10 w-10">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeletingProduct(product)} className="text-slate-400 hover:text-red-500 h-10 w-10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Sheet open={showNewProduct} onOpenChange={setShowNewProduct}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Νέο Προϊόν</SheetTitle></SheetHeader>
          <div className="mt-6">
            <ProductForm onSubmit={(data) => createMutation.mutate(data)} onCancel={() => setShowNewProduct(false)} isLoading={createMutation.isPending} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Επεξεργασία Προϊόντος</SheetTitle></SheetHeader>
          <div className="mt-6">
            {editingProduct && (
              <ProductForm product={editingProduct} onSubmit={(data) => updateMutation.mutate({ id: editingProduct.id, data })} onCancel={() => setEditingProduct(null)} isLoading={updateMutation.isPending} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Διαγραφή Προϊόντος</AlertDialogTitle>
            <AlertDialogDescription>Είστε σίγουροι ότι θέλετε να διαγράψετε το {deletingProduct?.name};</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingProduct.id)} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
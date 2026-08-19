'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToastStore } from '../../lib/store';
import { Warehouse, Plus, LayoutGrid, PackageCheck, Layers, ClipboardList } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const warehouseSchema = z.object({
  name: z.string().min(3, { message: 'Godown name is required' }),
  code: z.string().min(3, { message: 'Unique branch code is required' }),
  phone: z.string().optional(),
  email: z.string().email({ message: 'Enter a valid email' }).or(z.literal('')),
  address: z.string().min(5, { message: 'Address details required' }),
  managerName: z.string().min(3, { message: 'Manager name is required' })
});

export default function WarehousesPage() {
  const { addToast } = useToastStore();
  
  // Tab states: 'directory' | 'inventory'
  const [activeTab, setActiveTab] = useState<'directory' | 'inventory'>('directory');
  
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected warehouse for stock viewing
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<any>(null);
  const [stockAdjustmentVal, setStockAdjustmentVal] = useState<number>(0);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: '',
      code: '',
      phone: '',
      email: '',
      address: '',
      managerName: ''
    }
  });

  const loadWarehouses = () => {
    setLoading(true);
    fetch('/api/warehouses')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setWarehouses(data);
          if (data.length > 0 && !selectedWarehouseId) {
            setSelectedWarehouseId(data[0].code);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const loadStocks = () => {
    if (!selectedWarehouseId) return;
    setLoading(true);
    fetch(`/api/warehouses/stock?warehouseId=${selectedWarehouseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setStocks(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (activeTab === 'inventory') {
      loadStocks();
    }
  }, [activeTab, selectedWarehouseId]);

  const onSubmitWarehouse = async (data: any) => {
    try {
      const res = await fetch('/api/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create Godown');
      }

      addToast('success', 'Godown Registered', `Warehouse ${data.name} successfully registered.`);
      setIsAddModalOpen(false);
      reset();
      loadWarehouses();
    } catch (err: any) {
      addToast('error', 'Registration Failed', err.message);
    }
  };

  const handleAdjustStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockItem) return;

    try {
      const res = await fetch('/api/warehouses/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId: selectedWarehouseId,
          productId: selectedStockItem.productId,
          quantityChange: stockAdjustmentVal
        })
      });

      if (!res.ok) throw new Error('Failed to adjust inventory');

      addToast('success', 'Inventory Adjusted', 'Stock level successfully updated in Godown.');
      setIsStockModalOpen(false);
      loadStocks();
    } catch (err: any) {
      addToast('error', 'Adjustment Failed', err.message);
    }
  };

  const warehouseColumns = [
    { header: 'Godown / Site Name', accessor: 'name', sortable: true },
    { header: 'Branch Code', accessor: 'code', sortable: true },
    { header: 'Manager', accessor: 'managerName', sortable: true },
    { header: 'Phone Number', accessor: 'phone' },
    { header: 'Contact Email', accessor: 'email' },
    { header: 'Physical Address', accessor: 'address', render: (row: any) => <span className="truncate max-w-[150px] inline-block">{row.address}</span> },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'destructive'}>{row.status}</Badge> 
    }
  ];

  const stockColumns = [
    { header: 'Product Item', accessor: 'productName', sortable: true },
    { header: 'SKU Code', accessor: 'sku', sortable: true },
    { 
      header: 'Stock Quantity', 
      accessor: 'quantity', 
      render: (row: any) => (
        <span className={`font-extrabold ${row.quantity <= 15 ? 'text-rose-500' : 'text-foreground'}`}>
          {row.quantity} Units
        </span>
      ) 
    },
    { 
      header: 'Status', 
      render: (row: any) => (
        <Badge variant={row.quantity <= 15 ? 'destructive' : 'success'}>
          {row.quantity <= 15 ? 'Low Stock' : 'Good Stock'}
        </Badge>
      )
    }
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className="flex flex-col gap-5">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between select-none border-b border-border pb-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-primary" /> Godown & Inventory Dashboard
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Control store products and physical stock balances across multiple warehouses.</p>
            </div>
            {activeTab === 'directory' && (
              <Button variant="primary" onClick={() => setIsAddModalOpen(true)} className="h-9 font-bold self-start sm:self-auto mt-2 sm:mt-0">
                <Plus className="h-4 w-4" /> Add Godown / Site
              </Button>
            )}
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex bg-card border border-border/80 rounded-lg p-1 text-xs self-start shadow-xs select-none">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'directory' 
                  ? 'bg-primary text-primary-foreground shadow-xs' 
                  : 'text-zinc-650 dark:text-zinc-400 hover:text-foreground'
              }`}
            >
              <Layers className="h-4 w-4" /> Godowns Directory
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'inventory' 
                  ? 'bg-primary text-primary-foreground shadow-xs' 
                  : 'text-zinc-650 dark:text-zinc-400 hover:text-foreground'
              }`}
            >
              <PackageCheck className="h-4 w-4" /> Store Stock Matrix
            </button>
          </div>

          {activeTab === 'directory' ? (
            /* TAB 1: WAREHOUSES DIRECTORY */
            <DataTable
              title="Registered Storage Depots"
              data={warehouses}
              columns={warehouseColumns}
              searchKey="name"
              searchPlaceholder="Search Godowns..."
              isLoading={loading}
            />
          ) : (
            /* TAB 2: INVENTORY STOCK MATRIX */
            <div className="space-y-4">
              <Card className="shadow-xs">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none text-xs">
                  <div className="space-y-1 flex-1 max-w-sm">
                    <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Filter Inventory By Godown Location</label>
                    <select
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(e.target.value)}
                      className="h-10 w-full rounded border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      {warehouses.map((wh) => (
                        <option key={wh.code} value={wh.code}>{wh.name} ({wh.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="p-3 bg-muted/20 border border-border rounded-xl flex items-center gap-3 shrink-0">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-bold text-foreground">Total Unique SKUs</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{stocks.length} Products registered at this site</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <DataTable
                title={`Physical Inventory Stack at Location Code: ${selectedWarehouseId}`}
                data={stocks}
                columns={stockColumns}
                searchKey="productName"
                searchPlaceholder="Search SKUs at this site..."
                isLoading={loading}
                onEdit={(row: any) => {
                  setSelectedStockItem(row);
                  setStockAdjustmentVal(row.quantity);
                  setIsStockModalOpen(true);
                }}
              />
            </div>
          )}
        </div>

        {/* MODAL 1: ADD GODOWN */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Register Physical Godown / Site"
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmitWarehouse)} className="space-y-4 text-xs select-none">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Godown / Branch Name</label>
                <input {...register('name')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="e.g. Central Warehouse" />
                {errors.name && <p className="text-rose-500 text-[10px]">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Unique Code Key</label>
                <input {...register('code')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="e.g. WH-SL-04" />
                {errors.code && <p className="text-rose-500 text-[10px]">{errors.code.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Site Contact Phone</label>
                <input {...register('phone')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="(555) 000-0000" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Manager Full Name</label>
                <input {...register('managerName')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="Site supervisor name..." />
                {errors.managerName && <p className="text-rose-500 text-[10px]">{errors.managerName.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-zinc-500">Contact Email Address</label>
              <input {...register('email')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="site@poserp.com" />
              {errors.email && <p className="text-rose-500 text-[10px]">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-zinc-500">Physical Godown Address Details</label>
              <textarea {...register('address')} className="h-16 w-full rounded border border-border p-3 text-sm focus:outline-none bg-card text-foreground" placeholder="Complete geographic site address..." />
              {errors.address && <p className="text-rose-500 text-[10px]">{errors.address.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>Register Site</Button>
            </div>
          </form>
        </Modal>

        {/* MODAL 2: ADJUST STOCK QUANTITY */}
        <Modal
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          title="Adjust Godown SKU Inventory Level"
          size="sm"
        >
          {selectedStockItem && (
            <form onSubmit={handleAdjustStockSubmit} className="space-y-4 text-xs select-none">
              <div className="p-3 bg-muted/20 border border-border rounded-xl space-y-1 text-center">
                <p className="font-extrabold text-foreground">{selectedStockItem.productName}</p>
                <p className="text-[10px] text-muted-foreground">SKU Code Reference: {selectedStockItem.sku}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-500">Physical Stock Count (Units)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockAdjustmentVal}
                  onChange={(e) => setStockAdjustmentVal(Number(e.target.value))}
                  className="h-10 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <Button type="button" variant="outline" onClick={() => setIsStockModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Apply Stock Balance</Button>
              </div>
            </form>
          )}
        </Modal>

      </PageContainer>
    </AppShell>
  );
}
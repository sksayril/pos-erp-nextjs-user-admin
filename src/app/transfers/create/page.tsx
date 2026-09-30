'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useRouter } from 'next/navigation';
import { useToastStore } from '../../../lib/store';
import { 
  ArrowLeftRight, ArrowLeft, Plus, Trash2, 
  Building2, Truck, Calendar, CheckCircle2, ShieldCheck
} from 'lucide-react';

export default function CreateTransferPage() {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [fromWarehouseName, setFromWarehouseName] = useState('');
  const [toWarehouseName, setToWarehouseName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [shippingCharge, setShippingCharge] = useState(0);
  const [notes, setNotes] = useState('');

  // Line items state
  const [items, setItems] = useState<any[]>([
    {
      productId: '',
      productName: '',
      sku: '',
      quantity: 1,
      unitCost: 0,
      subtotal: 0
    }
  ]);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [resProd, resWh] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/warehouses')
        ]);
        if (resProd.ok) {
          const prods = await resProd.json();
          setProducts(Array.isArray(prods) ? prods : []);
        }
        if (resWh.ok) {
          const whs = await resWh.json();
          const list = Array.isArray(whs) ? whs : [];
          setWarehouses(list);
          if (list.length >= 2) {
            setFromWarehouseName(list[0].name);
            setToWarehouseName(list[1].name);
          } else if (list.length === 1) {
            setFromWarehouseName(list[0].name);
            setToWarehouseName(list[0].name);
          }
        }
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    }
    loadMetadata();
  }, []);

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find(p => p._id === productId || p.id === productId);
    if (!prod) return;

    const cost = Number(prod.cost || prod.costPrice || prod.price || 0);

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: prod._id || prod.id,
      productName: prod.name,
      sku: prod.sku || '',
      unitCost: cost,
      quantity: 1,
      subtotal: cost
    };
    setItems(updated);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    const qty = Number(item.quantity) || 1;
    const cost = Number(item.unitCost) || 0;
    item.subtotal = qty * cost;
    updated[index] = item;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        productId: '',
        productName: '',
        sku: '',
        quantity: 1,
        unitCost: 0,
        subtotal: 0
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalQuantity = items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  const totalCost = items.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromWarehouseName || !toWarehouseName) {
      addToast('error', 'Validation Error', 'Origin and Destination warehouses are required.');
      return;
    }

    if (fromWarehouseName === toWarehouseName) {
      addToast('error', 'Validation Error', 'Origin and Destination warehouses cannot be identical.');
      return;
    }

    const validItems = items.filter(i => i.productName.trim());
    if (validItems.length === 0) {
      addToast('error', 'Validation Error', 'Please add at least one valid product line item.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromWarehouseName,
          toWarehouseName,
          date,
          vehicleNumber,
          driverName,
          driverPhone,
          shippingCharge: Number(shippingCharge) || 0,
          items: validItems,
          notes,
          status: 'In Transit'
        })
      });

      if (res.ok) {
        const created = await res.json();
        addToast('success', 'Transfer Dispatched!', `Transfer ${created.transferNumber} created successfully.`);
        router.push('/transfers');
      } else {
        const err = await res.json();
        addToast('error', 'Dispatch Failed', err.error || 'Failed to record stock transfer.');
      }
    } catch (err) {
      addToast('error', 'Error', 'Failed to communicate with database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => router.back()} className="h-9 w-9 p-0 cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <ArrowLeftRight className="h-6 w-6 text-primary" /> Create Stock Transfer Challan
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Initiate stock movement between warehouses, dispatch transit vehicle, and generate delivery challan.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Route & Vehicle Info */}
            <Card className="border border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/60 pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Transit Route & Logistics Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Origin Warehouse (From) *</label>
                    <select
                      value={fromWarehouseName}
                      onChange={(e) => setFromWarehouseName(e.target.value)}
                      required
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {warehouses.map((w) => (
                        <option key={w._id || w.id} value={w.name}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Destination Warehouse (To) *</label>
                    <select
                      value={toWarehouseName}
                      onChange={(e) => setToWarehouseName(e.target.value)}
                      required
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {warehouses.map((w) => (
                        <option key={w._id || w.id} value={w.name}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Transfer Date *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Vehicle Registration #</label>
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. WB-02-AK-9988"
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Driver / Carrier Name</label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Driver Phone Number</label>
                    <input
                      type="text"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items Table */}
            <Card className="border border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/60 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" /> Stock Items for Transfer
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItemRow} className="cursor-pointer">
                  <Plus className="h-4 w-4" /> Add Item Line
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-left font-bold">
                        <th className="pb-3 w-1/2">Product Item *</th>
                        <th className="pb-3 w-28 text-center">Transfer Qty *</th>
                        <th className="pb-3 w-36 text-right">Unit Cost (₹)</th>
                        <th className="pb-3 w-36 text-right">Subtotal (₹)</th>
                        <th className="pb-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/10">
                          <td className="py-2.5 pr-2">
                            <select
                              value={item.productId}
                              onChange={(e) => handleProductSelect(idx, e.target.value)}
                              className="h-9 w-full rounded-lg border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="">-- Choose Inventory Product --</option>
                              {products.map((p) => (
                                <option key={p._id || p.id} value={p._id || p.id}>
                                  {p.name} {p.sku ? `(${p.sku})` : ''} — Cost: ₹{Number(p.cost || p.costPrice || 0).toLocaleString()}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                              className="h-9 w-full rounded-lg border border-border bg-card px-2 text-center text-xs font-bold text-foreground"
                            />
                          </td>

                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitCost}
                              onChange={(e) => handleItemChange(idx, 'unitCost', Number(e.target.value))}
                              className="h-9 w-full rounded-lg border border-border bg-card px-2 text-right text-xs font-mono"
                            />
                          </td>

                          <td className="py-2.5 pl-2 text-right font-mono font-bold text-foreground">
                            ₹{Number(item.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              disabled={items.length === 1}
                              className="h-7 w-7 rounded text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Notes & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-border/80 bg-card rounded-2xl shadow-sm p-5 space-y-3">
                <label className="text-xs font-bold text-foreground block">Transfer Dispatch Notes / Instructions</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter transit packaging instructions, security seal codes, or reasons for transfer..."
                  className="w-full rounded-xl border border-border bg-card p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </Card>

              <Card className="border border-border/80 bg-card rounded-2xl shadow-sm p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">
                  Cargo Summary
                </h3>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Total Transfer Items:</span>
                  <span className="font-bold text-foreground">{totalQuantity} units</span>
                </div>

                <div className="flex justify-between text-xs items-center">
                  <span className="text-muted-foreground">Logistics / Freight Cost (₹):</span>
                  <input
                    type="number"
                    value={shippingCharge}
                    onChange={(e) => setShippingCharge(Number(e.target.value))}
                    className="h-8 w-28 rounded-lg border border-border bg-card px-2 text-right font-mono text-xs text-foreground"
                  />
                </div>

                <div className="flex justify-between items-center text-lg font-black text-foreground pt-3 border-t border-border">
                  <span>Total Transferred Asset Cost:</span>
                  <span className="font-mono text-primary text-xl">₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={isSubmitting} className="cursor-pointer">
                    <CheckCircle2 className="h-4 w-4" /> Dispatch Stock Transfer
                  </Button>
                </div>
              </Card>
            </div>

          </form>
        </div>
      </PageContainer>
    </AppShell>
  );
}
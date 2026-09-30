'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useRouter } from 'next/navigation';
import { useToastStore } from '../../../lib/store';
import { 
  FileSpreadsheet, ArrowLeft, Plus, Trash2, Search, 
  Calendar, Building2, User, CheckCircle2, ShieldCheck, DollarSign
} from 'lucide-react';

export default function CreateQuotationPage() {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [warehouseName, setWarehouseName] = useState('Central Hub Warehouse');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [terms, setTerms] = useState('1. Quotation is valid for 30 calendar days from issue.\n2. 50% advance on PO confirmation, 50% upon delivery.\n3. Goods once sold are covered under standard manufacturer warranty.');
  const [notes, setNotes] = useState('');
  const [shipping, setShipping] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Items state
  const [items, setItems] = useState<any[]>([
    {
      productId: '',
      productName: '',
      sku: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      tax: 0,
      total: 0
    }
  ]);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [resProd, resCust, resWh] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/customers'),
          fetch('/api/settings/warehouse')
        ]);
        if (resProd.ok) {
          const prods = await resProd.json();
          setProducts(Array.isArray(prods) ? prods : []);
        }
        if (resCust.ok) {
          const custs = await resCust.json();
          setCustomers(Array.isArray(custs) ? custs : []);
        }
        if (resWh.ok) {
          const whs = await resWh.json();
          setWarehouses(Array.isArray(whs) ? whs : []);
        }
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    }
    loadMetadata();
  }, []);

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setCustomerName(name);
    const found = customers.find(c => c.name === name);
    if (found) {
      setCustomerPhone(found.phone || '');
      setCustomerEmail(found.email || '');
      setCustomerAddress(found.address || '');
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find(p => p._id === productId || p.id === productId);
    if (!prod) return;

    const price = Number(prod.price || prod.sellingPrice || 0);
    const tax = price * 0.18; // Standard 18% GST

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: prod._id || prod.id,
      productName: prod.name,
      sku: prod.sku || '',
      unitPrice: price,
      quantity: 1,
      discount: 0,
      tax,
      total: price + tax
    };
    setItems(updated);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unitPrice) || 0;
    const disc = Number(item.discount) || 0;
    const base = (qty * price) - disc;
    const tax = base * 0.18;
    item.tax = tax;
    item.total = base + tax;
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
        unitPrice: 0,
        discount: 0,
        tax: 0,
        total: 0
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, item) => acc + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)), 0);
  const itemsDiscount = items.reduce((acc, item) => acc + (Number(item.discount) || 0), 0);
  const totalTax = items.reduce((acc, item) => acc + (Number(item.tax) || 0), 0);
  const grandTotal = subtotal - itemsDiscount - Number(discount) + totalTax + Number(shipping);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      addToast('error', 'Validation Error', 'Customer name is required.');
      return;
    }

    const validItems = items.filter(i => i.productName.trim());
    if (validItems.length === 0) {
      addToast('error', 'Validation Error', 'Please select at least one valid product.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          customerAddress,
          warehouseName,
          date,
          validUntil,
          items: validItems,
          shipping: Number(shipping),
          discount: Number(discount),
          terms,
          notes,
          status: 'Sent'
        })
      });

      if (res.ok) {
        const created = await res.json();
        addToast('success', 'Quotation Created', `Proposal ${created.quotationNumber} recorded.`);
        router.push('/quotations');
      } else {
        const err = await res.json();
        addToast('error', 'Creation Failed', err.error || 'Failed to create quotation.');
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
                  <FileSpreadsheet className="h-6 w-6 text-primary" /> Create Sales Quotation
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Prepare customized B2B price estimates, tax calculations, and formal cost proposals.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Customer & Quote Header Info */}
            <Card className="border border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/60 pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Client & Proposal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Select Registered Customer</label>
                    <select
                      onChange={handleCustomerSelect}
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">-- Choose Existing Client --</option>
                      {customers.map((c) => (
                        <option key={c._id || c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Customer / Company Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter client company name..."
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="procurement@client.com"
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Quotation Date *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Valid Until (Expiry Date) *</label>
                    <input
                      type="date"
                      required
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-xs font-bold text-foreground block mb-1.5">Billing & Delivery Address</label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Full office or delivery warehouse address..."
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
                  <FileSpreadsheet className="h-4 w-4 text-primary" /> Product Line Items & Quantities
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
                        <th className="pb-3 w-1/3">Product Catalog Item *</th>
                        <th className="pb-3 w-20 text-center">Qty</th>
                        <th className="pb-3 w-28 text-right">Unit Price (₹)</th>
                        <th className="pb-3 w-24 text-right">Discount (₹)</th>
                        <th className="pb-3 w-24 text-right">GST (18%)</th>
                        <th className="pb-3 w-28 text-right">Total (₹)</th>
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
                              <option value="">-- Choose Product Item --</option>
                              {products.map((p) => (
                                <option key={p._id || p.id} value={p._id || p.id}>
                                  {p.name} {p.sku ? `(${p.sku})` : ''} — ₹{Number(p.price || p.sellingPrice || 0).toLocaleString()}
                                </option>
                              ))}
                            </select>
                            {item.productName && !products.some(p => p._id === item.productId) && (
                              <input
                                type="text"
                                value={item.productName}
                                onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                                placeholder="Custom item name"
                                className="h-8 w-full mt-1 rounded border border-border bg-card px-2 text-xs"
                              />
                            )}
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
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                              className="h-9 w-full rounded-lg border border-border bg-card px-2 text-right text-xs font-mono"
                            />
                          </td>

                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.discount}
                              onChange={(e) => handleItemChange(idx, 'discount', Number(e.target.value))}
                              className="h-9 w-full rounded-lg border border-border bg-card px-2 text-right text-xs font-mono text-emerald-600"
                            />
                          </td>

                          <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">
                            ₹{Number(item.tax || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </td>

                          <td className="py-2.5 pl-2 text-right font-mono font-bold text-foreground">
                            ₹{Number(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

            {/* Terms and Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-border/80 bg-card rounded-2xl shadow-sm p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Terms & Payment Conditions</label>
                  <textarea
                    rows={4}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">Internal Executive Remarks</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add special notes for the client or sales team..."
                    className="w-full rounded-xl border border-border bg-card p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </Card>

              <Card className="border border-border/80 bg-card rounded-2xl shadow-sm p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">
                  Financial Summary (₹)
                </h3>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono text-foreground">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Item Discounts:</span>
                  <span className="font-mono">-₹{itemsDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between text-xs items-center">
                  <span className="text-muted-foreground">Additional Discount (₹):</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="h-8 w-28 rounded-lg border border-border bg-card px-2 text-right font-mono text-xs text-emerald-600"
                  />
                </div>

                <div className="flex justify-between text-xs items-center">
                  <span className="text-muted-foreground">Shipping / Logistics (₹):</span>
                  <input
                    type="number"
                    value={shipping}
                    onChange={(e) => setShipping(Number(e.target.value))}
                    className="h-8 w-28 rounded-lg border border-border bg-card px-2 text-right font-mono text-xs text-foreground"
                  />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Estimated GST Taxes (18%):</span>
                  <span className="font-mono text-foreground">+₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center text-lg font-black text-foreground pt-3 border-t border-border">
                  <span>Quotation Grand Total:</span>
                  <span className="font-mono text-primary text-xl">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={isSubmitting} className="cursor-pointer">
                    <CheckCircle2 className="h-4 w-4" /> Generate & Save Quotation
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
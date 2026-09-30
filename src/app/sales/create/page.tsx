'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useRouter } from 'next/navigation';
import { useToastStore } from '../../../lib/store';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  User, 
  Package, 
  Calculator,
  CreditCard
} from 'lucide-react';

interface SaleLineItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  tax: number;
  total: number;
}

export default function CreateSalePage() {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [headerData, setHeaderData] = useState({
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    customerId: 'cust-1',
    customerName: 'Walk-in Customer',
    customerPhone: '',
    warehouseId: 'Main Central Hub',
    paymentMethod: 'Cash',
    status: 'Completed',
    notes: ''
  });

  const [items, setItems] = useState<SaleLineItem[]>([
    {
      productId: '',
      productName: '',
      sku: '',
      quantity: 1,
      price: 0,
      tax: 18,
      total: 0
    }
  ]);

  const [discountAmount, setDiscountAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => {
    // Fetch products
    fetch('/api/products')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          if (!items[0].productId) {
            selectProductForItem(0, data[0]);
          }
        }
      })
      .catch(err => console.error('Fetch products error:', err));

    // Fetch customers
    fetch('/api/people/customers')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCustomers(data);
        }
      })
      .catch(err => console.error('Fetch customers error:', err));
  }, []);

  const selectProductForItem = (index: number, product: any) => {
    setItems(prev => {
      const updated = [...prev];
      const qty = updated[index]?.quantity || 1;
      const unitPrice = Number(product.sellingPrice) || 0;
      const taxRate = Number(product.taxRate) || 18;
      const taxAmount = (unitPrice * qty * taxRate) / 100;
      const lineTotal = (unitPrice * qty) + taxAmount;

      updated[index] = {
        productId: product._id || product.id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        price: unitPrice,
        tax: taxRate,
        total: lineTotal
      };
      return updated;
    });
  };

  const handleItemChange = (index: number, field: keyof SaleLineItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };
      const qty = Number(current.quantity) || 1;
      const price = Number(current.price) || 0;
      const taxRate = Number(current.tax) || 0;
      const taxAmount = (price * qty * taxRate) / 100;
      current.total = (price * qty) + taxAmount;
      updated[index] = current;
      return updated;
    });
  };

  const addItemRow = () => {
    const defaultProduct = products[0] || {};
    const unitPrice = Number(defaultProduct.sellingPrice) || 0;
    const taxRate = Number(defaultProduct.taxRate) || 18;
    const lineTotal = unitPrice + ((unitPrice * taxRate) / 100);

    setItems(prev => [
      ...prev,
      {
        productId: defaultProduct._id || defaultProduct.id || '',
        productName: defaultProduct.name || 'Custom Item',
        sku: defaultProduct.sku || 'SKU-NEW',
        quantity: 1,
        price: unitPrice,
        tax: taxRate,
        total: lineTotal
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) {
      addToast('warning', 'Notice', 'At least one item must remain on the invoice.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, item) => acc + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
  const totalTax = items.reduce((acc, item) => {
    const lineSub = (Number(item.price) || 0) * (Number(item.quantity) || 1);
    return acc + ((lineSub * (Number(item.tax) || 0)) / 100);
  }, 0);
  const grandTotal = Math.max(0, subtotal + totalTax - Number(discountAmount));
  const dueAmount = Math.max(0, grandTotal - Number(paidAmount));

  // Sync default paidAmount on change if full payment
  useEffect(() => {
    setPaidAmount(grandTotal);
  }, [grandTotal]);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const found = customers.find(c => (c._id === val || c.id === val || c.name === val));
    if (found) {
      setHeaderData(prev => ({
        ...prev,
        customerId: found._id || found.id,
        customerName: found.name,
        customerPhone: found.phone || ''
      }));
    } else {
      setHeaderData(prev => ({ ...prev, customerName: val }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerData.customerName) {
      addToast('warning', 'Validation', 'Customer name is required');
      return;
    }

    if (items.length === 0 || !items[0].productName) {
      addToast('warning', 'Validation', 'Please add at least one product item');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        invoiceNumber: headerData.invoiceNumber,
        date: headerData.date,
        customerId: headerData.customerId,
        customerName: headerData.customerName,
        customerPhone: headerData.customerPhone,
        warehouseId: headerData.warehouseId,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
          discount: 0,
          tax: Number(item.tax) || 0,
          total: Number(item.total) || 0
        })),
        subtotal,
        discount: Number(discountAmount) || 0,
        tax: totalTax,
        grandTotal,
        paidAmount: Number(paidAmount) || 0,
        dueAmount,
        paymentStatus: dueAmount === 0 ? 'Paid' : Number(paidAmount) > 0 ? 'Partial' : 'Due',
        status: headerData.status,
        paymentMethod: headerData.paymentMethod
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record sale');

      addToast('success', 'Sale Created', `Invoice ${headerData.invoiceNumber} recorded and inventory updated!`);
      router.push('/sales');
    } catch (err: any) {
      console.error('Save error:', err);
      addToast('error', 'Error', err.message || 'Could not record sale invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <PageContainer>
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => router.push('/sales')} className="h-9 w-9 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" /> Create Sales Invoice
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generate customer tax invoices, perform stock deductions, and record accounts receivables.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleSubmit} 
                disabled={saving} 
                size="sm" 
                className="gap-1.5 text-xs h-9 font-semibold"
              >
                <Save className="h-4 w-4" /> {saving ? 'Recording...' : 'Generate Invoice & Checkout'}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Header Form Card */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> 1. Customer & Invoice Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Invoice Ref # *</label>
                    <input 
                      type="text" 
                      required
                      value={headerData.invoiceNumber}
                      onChange={(e) => setHeaderData({ ...headerData, invoiceNumber: e.target.value.toUpperCase() })}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Sale Date</label>
                    <input 
                      type="date" 
                      value={headerData.date}
                      onChange={(e) => setHeaderData({ ...headerData, date: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Customer *</label>
                    <select 
                      value={headerData.customerName} 
                      onChange={handleCustomerChange}
                      className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Walk-in Customer">Walk-in Customer (Cash POS)</option>
                      {customers.map((c, i) => (
                        <option key={i} value={c.name}>{c.name}</option>
                      ))}
                      {customers.length === 0 && (
                        <>
                          <option value="Rahul Sharma">Rahul Sharma</option>
                          <option value="TechCorp Solutions Pvt Ltd">TechCorp Solutions Pvt Ltd</option>
                          <option value="Priya Patel">Priya Patel</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Dispatch Warehouse</label>
                    <select 
                      value={headerData.warehouseId}
                      onChange={(e) => setHeaderData({ ...headerData, warehouseId: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Main Central Hub">Main Central Hub</option>
                      <option value="North Annex Depot">North Annex Depot</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Payment Mode</label>
                    <select 
                      value={headerData.paymentMethod}
                      onChange={(e) => setHeaderData({ ...headerData, paymentMethod: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Cash">Cash (Immediate Receipt)</option>
                      <option value="UPI">UPI / QR Payment</option>
                      <option value="Credit Card">Credit / Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="Cheque">Bank Cheque</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Order Status</label>
                    <select 
                      value={headerData.status}
                      onChange={(e) => setHeaderData({ ...headerData, status: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Completed">Completed (Deduct Physical Stock Now)</option>
                      <option value="Pending">Pending (Hold Stock)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items Table Card */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" /> 2. Items & Services Sold
                </CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addItemRow} 
                  className="h-8 gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Product Item
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-2.5 w-1/3">Product</th>
                        <th className="p-2.5 w-24">SKU</th>
                        <th className="p-2.5 w-24 text-center">Quantity</th>
                        <th className="p-2.5 w-32 text-right">Unit Price (Rs.)</th>
                        <th className="p-2.5 w-24 text-right">Tax (%)</th>
                        <th className="p-2.5 w-32 text-right">Total (Rs.)</th>
                        <th className="p-2.5 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="p-2">
                            <select 
                              value={item.productId}
                              onChange={(e) => {
                                const selected = products.find(p => (p._id || p.id) === e.target.value);
                                if (selected) selectProductForItem(idx, selected);
                              }}
                              className="h-9 w-full rounded-lg border border-border px-2 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="">Select Item from Catalog</option>
                              {products.map((p, pIdx) => (
                                <option key={pIdx} value={p._id || p.id}>{p.name} ({p.sku})</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input 
                              type="text" 
                              value={item.sku}
                              onChange={(e) => handleItemChange(idx, 'sku', e.target.value)}
                              className="h-9 w-full rounded-lg border border-border px-2 bg-muted/40 font-mono text-xs text-foreground focus:outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                              className="h-9 w-full rounded-lg border border-border px-2 text-center font-mono text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              step="any"
                              value={item.price}
                              onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                              className="h-9 w-full rounded-lg border border-border px-2 text-right font-mono text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </td>
                          <td className="p-2">
                            <select 
                              value={item.tax}
                              onChange={(e) => handleItemChange(idx, 'tax', parseFloat(e.target.value) || 0)}
                              className="h-9 w-full rounded-lg border border-border px-1 text-right font-mono text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value={0}>0%</option>
                              <option value={5}>5%</option>
                              <option value={12}>12%</option>
                              <option value={18}>18%</option>
                              <option value={28}>28%</option>
                            </select>
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-foreground">
                            Rs. {item.total.toLocaleString()}
                          </td>
                          <td className="p-2 text-center">
                            <button 
                              type="button" 
                              onClick={() => removeItemRow(idx)}
                              className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-md inline-flex items-center justify-center"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Settlement Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-sm font-semibold">Terms & Customer Notes</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-xs">
                  <textarea 
                    rows={4}
                    placeholder="Provide warranty remarks, sales terms, return policy, or delivery instructions..."
                    value={headerData.notes}
                    onChange={(e) => setHeaderData({ ...headerData, notes: e.target.value })}
                    className="w-full rounded-lg border border-border p-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </CardContent>
              </Card>

              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-emerald-500" /> Invoice Valuation & Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Items Subtotal:</span>
                    <span className="font-mono font-semibold text-foreground">Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>GST / Sales Tax Total:</span>
                    <span className="font-mono font-semibold text-foreground">+Rs. {totalTax.toLocaleString()}</span>
                  </div>
                  <div className="space-y-1 pt-1">
                    <label className="text-muted-foreground">Discount (Rs.):</label>
                    <input 
                      type="number" 
                      value={discountAmount || ''}
                      placeholder="0"
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="h-8 w-full rounded-lg border border-border px-2 text-right font-mono bg-background text-foreground"
                    />
                  </div>

                  <div className="flex justify-between items-center font-bold text-sm text-foreground border-t border-border pt-3">
                    <span>Grand Total:</span>
                    <span className="font-mono text-primary text-base">Rs. {grandTotal.toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                    <div className="space-y-1">
                      <label className="font-semibold text-emerald-600">Amount Received (Rs.):</label>
                      <input 
                        type="number" 
                        value={paidAmount || ''}
                        placeholder="0"
                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                        className="h-9 w-full rounded-lg border border-emerald-500/50 px-2.5 text-right font-mono font-bold bg-background text-foreground focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-rose-500">Customer Due Balance:</label>
                      <div className="h-9 w-full rounded-lg border border-border px-2.5 flex items-center justify-end font-mono font-bold bg-muted/40 text-rose-500 text-sm">
                        Rs. {dueAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push('/sales')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="font-semibold gap-2">
                <Save className="h-4 w-4" /> {saving ? 'Recording...' : 'Generate Invoice & Complete Sale'}
              </Button>
            </div>

          </form>

        </div>
      </PageContainer>
    </AppShell>
  );
}
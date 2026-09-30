'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useRouter } from 'next/navigation';
import { useToastStore } from '../../../lib/store';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Building2, 
  Layers, 
  DollarSign, 
  Calculator,
  Search,
  Package
} from 'lucide-react';

interface PurchaseLineItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  tax: number;
  total: number;
}

export default function CreatePurchasePage() {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [headerData, setHeaderData] = useState({
    purchaseNumber: `PUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    invoiceNumber: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplierName: '',
    supplierPhone: '',
    warehouseId: 'Main Warehouse - Central',
    paymentMethod: 'Bank Transfer',
    status: 'Received',
    notes: ''
  });

  const [items, setItems] = useState<PurchaseLineItem[]>([
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
  const [shippingCost, setShippingCost] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => {
    // Fetch products
    fetch('/api/products')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
          if (data.length > 0 && !items[0].productId) {
            selectProductForItem(0, data[0]);
          }
        }
      })
      .catch(err => console.error('Fetch products error:', err));

    // Fetch suppliers
    fetch('/api/people/suppliers')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSuppliers(data);
          setHeaderData(prev => ({
            ...prev,
            supplierId: data[0]._id || data[0].id,
            supplierName: data[0].name,
            supplierPhone: data[0].phone || ''
          }));
        } else {
          // Default fallback suppliers
          setHeaderData(prev => ({
            ...prev,
            supplierName: 'Apple Authorized Distributor',
            supplierPhone: '+91 9876543210'
          }));
        }
      })
      .catch(err => console.error('Fetch suppliers error:', err));
  }, []);

  const selectProductForItem = (index: number, product: any) => {
    setItems(prev => {
      const updated = [...prev];
      const qty = updated[index]?.quantity || 1;
      const unitPrice = Number(product.costPrice) || Number(product.purchasePrice) || 0;
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

  const handleItemChange = (index: number, field: keyof PurchaseLineItem, value: any) => {
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
    const unitPrice = Number(defaultProduct.costPrice) || 0;
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
      addToast('warning', 'Notice', 'At least one item must remain on the purchase invoice.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
  const totalTax = items.reduce((acc, item) => {
    const lineSub = (Number(item.price) || 0) * (Number(item.quantity) || 1);
    return acc + ((lineSub * (Number(item.tax) || 0)) / 100);
  }, 0);
  const grandTotal = Math.max(0, subtotal + totalTax + Number(shippingCost) - Number(discountAmount));
  const dueAmount = Math.max(0, grandTotal - Number(paidAmount));

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const found = suppliers.find(s => s._id === val || s.name === val);
    if (found) {
      setHeaderData(prev => ({
        ...prev,
        supplierId: found._id,
        supplierName: found.name,
        supplierPhone: found.phone || ''
      }));
    } else {
      setHeaderData(prev => ({ ...prev, supplierName: val }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerData.supplierName) {
      addToast('warning', 'Validation', 'Supplier / Vendor name is required');
      return;
    }

    if (items.length === 0 || !items[0].productName) {
      addToast('warning', 'Validation', 'Please add at least one valid product item');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        purchaseNumber: headerData.purchaseNumber,
        invoiceNumber: headerData.invoiceNumber,
        date: headerData.date,
        supplierId: headerData.supplierId || 'sup-1',
        supplierName: headerData.supplierName,
        supplierPhone: headerData.supplierPhone,
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

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record purchase');

      addToast('success', 'Purchase Recorded', `Purchase ${headerData.purchaseNumber} recorded and inventory updated!`);
      router.push('/purchases');
    } catch (err: any) {
      console.error('Save error:', err);
      addToast('error', 'Error', err.message || 'Could not save purchase invoice');
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
              <Button variant="outline" size="sm" onClick={() => router.push('/purchases')} className="h-9 w-9 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" /> Create Purchase Invoice (Vendor Bill)
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Record supplier stock inbound, automated inventory additions, and accounts payable ledger.
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
                <Save className="h-4 w-4" /> {saving ? 'Recording...' : 'Save & Receive Stock'}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Header Form Card */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> 1. Vendor & Purchase Reference
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Purchase Ref # *</label>
                    <input 
                      type="text" 
                      required
                      value={headerData.purchaseNumber}
                      onChange={(e) => setHeaderData({ ...headerData, purchaseNumber: e.target.value.toUpperCase() })}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Vendor Invoice Ref #</label>
                    <input 
                      type="text" 
                      placeholder="e.g. INV-9912"
                      value={headerData.invoiceNumber}
                      onChange={(e) => setHeaderData({ ...headerData, invoiceNumber: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Purchase Date</label>
                    <input 
                      type="date" 
                      value={headerData.date}
                      onChange={(e) => setHeaderData({ ...headerData, date: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Receiving Warehouse</label>
                    <select 
                      value={headerData.warehouseId}
                      onChange={(e) => setHeaderData({ ...headerData, warehouseId: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Main Warehouse - Central">Main Warehouse - Central</option>
                      <option value="North Annex Depot">North Annex Depot</option>
                      <option value="Retail Store Front Backroom">Retail Store Front Backroom</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Supplier / Vendor *</label>
                    <div className="flex gap-2">
                      <select 
                        value={headerData.supplierName} 
                        onChange={handleSupplierChange}
                        className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {suppliers.map((s, i) => (
                          <option key={i} value={s.name}>{s.name}</option>
                        ))}
                        {suppliers.length === 0 && (
                          <>
                            <option value="Apple Authorized Distributor">Apple Authorized Distributor</option>
                            <option value="Samsung Direct Logistics">Samsung Direct Logistics</option>
                            <option value="Sony Audio Importers">Sony Audio Importers</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Receiving Status</label>
                    <select 
                      value={headerData.status}
                      onChange={(e) => setHeaderData({ ...headerData, status: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Received">Received (Instantly Add Stock to Inventory)</option>
                      <option value="Pending">Pending (Do Not Increment Stock Yet)</option>
                      <option value="Ordered">Ordered (Awaiting Dispatch)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Payment Mode</label>
                    <select 
                      value={headerData.paymentMethod}
                      onChange={(e) => setHeaderData({ ...headerData, paymentMethod: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                      <option value="Cash">Cash on Delivery</option>
                      <option value="UPI">Corporate UPI / QR</option>
                      <option value="Cheque">Bank Cheque</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items Table Card */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" /> 2. Purchased Items & Stock Units
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
                        <th className="p-2.5 w-32 text-right">Purchase Price (Rs.)</th>
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

            {/* Financial Summary & Settlement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-sm font-semibold">Additional Remarks & Notes</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-xs">
                  <textarea 
                    rows={4}
                    placeholder="Provide purchase order remarks, transportation consignment tracking, or quality audit comments..."
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
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-muted-foreground">Discount (Rs.):</label>
                      <input 
                        type="number" 
                        value={discountAmount || ''}
                        placeholder="0"
                        onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                        className="h-8 w-full rounded-lg border border-border px-2 text-right font-mono bg-background text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-muted-foreground">Shipping / Freight (Rs.):</label>
                      <input 
                        type="number" 
                        value={shippingCost || ''}
                        placeholder="0"
                        onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                        className="h-8 w-full rounded-lg border border-border px-2 text-right font-mono bg-background text-foreground"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center font-bold text-sm text-foreground border-t border-border pt-3">
                    <span>Grand Total:</span>
                    <span className="font-mono text-primary text-base">Rs. {grandTotal.toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                    <div className="space-y-1">
                      <label className="font-semibold text-emerald-600">Amount Paid Now (Rs.):</label>
                      <input 
                        type="number" 
                        value={paidAmount || ''}
                        placeholder="0"
                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                        className="h-9 w-full rounded-lg border border-emerald-500/50 px-2.5 text-right font-mono font-bold bg-background text-foreground focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-rose-500">Remaining Balance (Due):</label>
                      <div className="h-9 w-full rounded-lg border border-border px-2.5 flex items-center justify-end font-mono font-bold bg-muted/40 text-rose-500 text-sm">
                        Rs. {dueAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push('/purchases')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="font-semibold gap-2">
                <Save className="h-4 w-4" /> {saving ? 'Recording...' : 'Record Purchase & Receive Stock'}
              </Button>
            </div>

          </form>

        </div>
      </PageContainer>
    </AppShell>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useParams, useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Printer, 
  Building2, 
  Calendar, 
  CreditCard, 
  Package, 
  Trash2 
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function PurchaseBillDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToastStore();
  const id = params?.id as string;

  const [purchase, setPurchase] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch('/api/purchases')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const found = data.find((p: any) => p._id === id || p.id === id || p.purchaseNumber === id);
          if (found) {
            setPurchase(found);
          }
        }
      })
      .catch(err => console.error('Fetch purchase error:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!purchase) return;
    try {
      const res = await fetch(`/api/purchases?id=${purchase._id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Deleted', `Purchase record removed.`);
        router.push('/purchases');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      addToast('error', 'Error', 'Failed to delete purchase');
    }
  };

  if (loading) {
    return (
      <AppShell>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-sm text-muted-foreground animate-pulse">Loading purchase invoice details...</p>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  if (!purchase) {
    return (
      <AppShell>
        <PageContainer>
          <div className="text-center py-12 space-y-4">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-bold text-foreground">Purchase Invoice Not Found</h2>
            <p className="text-xs text-muted-foreground">The requested purchase bill ID does not exist in your MongoDB records.</p>
            <Button onClick={() => router.push('/purchases')} size="sm">Back to Purchases</Button>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header Actions (Hidden on Print) */}
          <div className="print:hidden flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => router.push('/purchases')} className="h-9 w-9 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" /> Purchase Bill: {purchase.purchaseNumber}
                </h1>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Supplier: {purchase.supplierName} | Date: {purchase.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.print()} 
                className="h-9 gap-1.5 text-xs font-semibold"
              >
                <Printer className="h-3.5 w-3.5" /> Print Invoice
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDelete} 
                className="h-9 gap-1.5 text-xs font-semibold"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </div>

          {/* Printable Invoice Sheet */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-md space-y-6 text-foreground print:border-none print:shadow-none print:p-0">
            
            {/* Header / Vendor Info */}
            <div className="flex justify-between items-start border-b border-border/80 pb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Purchase Inbound Bill</span>
                <h2 className="text-2xl font-black text-foreground mt-1">CRIPOCOD POS & ERP</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Central Logistics Hub, Sector 4</p>
                <p className="text-xs text-muted-foreground">contact@cripocod.io | GSTIN: 27AABCP1234F1Z9</p>
              </div>
              <div className="text-right space-y-1">
                <Badge variant={purchase.paymentStatus === 'Paid' ? 'success' : purchase.paymentStatus === 'Partial' ? 'warning' : 'destructive'} className="text-xs">
                  {purchase.paymentStatus}
                </Badge>
                <p className="text-sm font-mono font-bold text-foreground mt-2">{purchase.purchaseNumber}</p>
                <p className="text-xs text-muted-foreground font-mono">Date: {purchase.date}</p>
                {purchase.invoiceNumber && <p className="text-xs text-muted-foreground font-mono">Vendor Inv: {purchase.invoiceNumber}</p>}
              </div>
            </div>

            {/* Parties Section */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Vendor / Supplier:</span>
                <p className="text-sm font-bold text-foreground">{purchase.supplierName}</p>
                <p className="text-muted-foreground">{purchase.supplierPhone || 'Authorized Commercial Partner'}</p>
                <p className="text-muted-foreground">Payment Method: <strong>{purchase.paymentMethod || 'Bank Transfer'}</strong></p>
              </div>
              <div className="space-y-1 text-right">
                <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Delivery Destination:</span>
                <p className="text-sm font-bold text-foreground">{purchase.warehouseId || 'Main Central Warehouse'}</p>
                <p className="text-muted-foreground">Receiving Status: <strong>{purchase.status || 'Received'}</strong></p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Item Description</th>
                    <th className="p-3 text-center">SKU</th>
                    <th className="p-3 text-center">Quantity</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Array.isArray(purchase.items) && purchase.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-3 font-mono text-muted-foreground">{idx + 1}</td>
                      <td className="p-3 font-semibold text-foreground">{item.productName}</td>
                      <td className="p-3 text-center font-mono text-muted-foreground">{item.sku || 'N/A'}</td>
                      <td className="p-3 text-center font-mono font-bold text-foreground">{item.quantity}</td>
                      <td className="p-3 text-right font-mono text-muted-foreground">Rs. {Number(item.price || 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-foreground">
                        Rs. {Number(item.total || (item.quantity * item.price)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Totals */}
            <div className="flex justify-end pt-2">
              <div className="w-72 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span className="font-mono">Rs. {Number(purchase.subtotal || 0).toLocaleString()}</span>
                </div>
                {Number(purchase.discount) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount:</span>
                    <span className="font-mono text-emerald-600">-Rs. {Number(purchase.discount).toLocaleString()}</span>
                  </div>
                )}
                {Number(purchase.tax) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax / GST:</span>
                    <span className="font-mono">+Rs. {Number(purchase.tax).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-foreground border-t border-border pt-2">
                  <span>Grand Total:</span>
                  <span className="font-mono text-primary">Rs. {Number(purchase.grandTotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold border-t border-border/60 pt-1">
                  <span>Amount Settled:</span>
                  <span className="font-mono">Rs. {Number(purchase.paidAmount || 0).toLocaleString()}</span>
                </div>
                {Number(purchase.dueAmount) > 0 && (
                  <div className="flex justify-between text-rose-500 font-bold">
                    <span>Balance Due:</span>
                    <span className="font-mono">Rs. {Number(purchase.dueAmount).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer remarks */}
            <div className="border-t border-border/80 pt-4 text-center text-[11px] text-muted-foreground">
              <p>Generated by CRIPOCOD POS & ERP Enterprise System. All receiving goods subject to warehouse inspection.</p>
            </div>

          </div>

        </div>
      </PageContainer>
    </AppShell>
  );
}
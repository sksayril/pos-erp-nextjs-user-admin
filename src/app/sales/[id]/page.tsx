'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useParams, useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Printer, 
  User, 
  CreditCard, 
  Package, 
  Trash2,
  FileText
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function SaleInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToastStore();
  const id = params?.id as string;

  const [sale, setSale] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch('/api/sales')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const found = data.find((s: any) => s._id === id || s.id === id || s.invoiceNumber === id);
          if (found) {
            setSale(found);
          }
        }
      })
      .catch(err => console.error('Fetch sale invoice error:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!sale || !confirm(`Are you sure you want to delete invoice "${sale.invoiceNumber}"?`)) return;
    try {
      const res = await fetch(`/api/sales?id=${sale._id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Deleted', `Invoice record removed.`);
        router.push('/sales');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      addToast('error', 'Error', 'Failed to delete sale invoice');
    }
  };

  if (loading) {
    return (
      <AppShell>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-sm text-muted-foreground animate-pulse">Loading invoice specifications...</p>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  if (!sale) {
    return (
      <AppShell>
        <PageContainer>
          <div className="text-center py-12 space-y-4">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-bold text-foreground">Invoice Not Found</h2>
            <p className="text-xs text-muted-foreground">The requested invoice reference does not exist in your MongoDB records.</p>
            <Button onClick={() => router.push('/sales')} size="sm">Back to Sales</Button>
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
              <Button variant="outline" size="sm" onClick={() => router.push('/sales')} className="h-9 w-9 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Tax Invoice: {sale.invoiceNumber}
                </h1>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Customer: {sale.customerName} | Date: {sale.date}
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
                <Printer className="h-3.5 w-3.5" /> Print Tax Invoice
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
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Official Tax Invoice</span>
                <h2 className="text-2xl font-black text-foreground mt-1">CRIPOCOD POS & ERP</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Corporate Retail & Wholesale Hub, Sector 4</p>
                <p className="text-xs text-muted-foreground">contact@cripocod.io | GSTIN: 27AABCP1234F1Z9</p>
              </div>
              <div className="text-right space-y-1">
                <Badge variant={sale.paymentStatus === 'Paid' ? 'success' : sale.paymentStatus === 'Partial' ? 'warning' : 'destructive'} className="text-xs">
                  {sale.paymentStatus}
                </Badge>
                <p className="text-sm font-mono font-bold text-foreground mt-2">{sale.invoiceNumber}</p>
                <p className="text-xs text-muted-foreground font-mono">Date: {sale.date}</p>
              </div>
            </div>

            {/* Parties Section */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Billed To (Customer):</span>
                <p className="text-sm font-bold text-foreground">{sale.customerName}</p>
                <p className="text-muted-foreground">{sale.customerPhone || 'Walk-in Registered Buyer'}</p>
                <p className="text-muted-foreground">Payment Method: <strong>{sale.paymentMethod || 'Cash'}</strong></p>
              </div>
              <div className="space-y-1 text-right">
                <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Dispatch Location:</span>
                <p className="text-sm font-bold text-foreground">{sale.warehouseId || 'Main Central Hub'}</p>
                <p className="text-muted-foreground">Fulfillment: <strong>{sale.status || 'Completed'}</strong></p>
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
                    <th className="p-3 text-right">Unit Rate</th>
                    <th className="p-3 text-right">Total (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Array.isArray(sale.items) && sale.items.map((item: any, idx: number) => (
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
                  <span className="font-mono">Rs. {Number(sale.subtotal || 0).toLocaleString()}</span>
                </div>
                {Number(sale.discount) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount:</span>
                    <span className="font-mono text-emerald-600">-Rs. {Number(sale.discount).toLocaleString()}</span>
                  </div>
                )}
                {Number(sale.tax) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST / Tax:</span>
                    <span className="font-mono">+Rs. {Number(sale.tax).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-foreground border-t border-border pt-2">
                  <span>Grand Total:</span>
                  <span className="font-mono text-primary">Rs. {Number(sale.grandTotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold border-t border-border/60 pt-1">
                  <span>Amount Received:</span>
                  <span className="font-mono">Rs. {Number(sale.paidAmount || 0).toLocaleString()}</span>
                </div>
                {Number(sale.dueAmount) > 0 && (
                  <div className="flex justify-between text-rose-500 font-bold">
                    <span>Balance Due:</span>
                    <span className="font-mono">Rs. {Number(sale.dueAmount).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border/80 pt-4 text-center text-[11px] text-muted-foreground">
              <p>Thank you for your business! Computer-generated tax invoice verified under GST compliance rules.</p>
            </div>

          </div>

        </div>
      </PageContainer>
    </AppShell>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useParams, useRouter } from 'next/navigation';
import { 
  FileSpreadsheet, 
  ArrowLeft, 
  Printer, 
  User, 
  Building2, 
  Trash2,
  CheckCircle2,
  Sparkles,
  Calendar,
  FileCheck
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function QuotationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToastStore();
  const id = params?.id as string;

  const [quote, setQuote] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/quotations/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setQuote(data);
      })
      .catch(() => {
        // Fallback search list
        fetch('/api/quotations')
          .then(res => res.json())
          .then(list => {
            if (Array.isArray(list)) {
              const found = list.find((q: any) => q._id === id || q.quotationNumber === id);
              if (found) setQuote(found);
            }
          });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleConvert = async () => {
    if (!quote) return;
    if (quote.status === 'Converted') {
      addToast('info', 'Already Converted', 'This quotation has already been converted into a sales invoice.');
      return;
    }

    try {
      setIsConverting(true);
      const res = await fetch(`/api/quotations/${quote._id}/convert`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        addToast('success', 'Converted to Sale!', data.message);
        setQuote((q: any) => ({ ...q, status: 'Converted' }));
      } else {
        const err = await res.json();
        addToast('error', 'Conversion Failed', err.error || 'Could not convert to sale.');
      }
    } catch (err) {
      addToast('error', 'Error', 'Failed to convert quotation.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!quote) return;

    try {
      const res = await fetch(`/api/quotations/${quote._id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Quotation Deleted', `${quote.quotationNumber} removed.`);
        router.push('/quotations');
      }
    } catch (err) {
      addToast('error', 'Error', 'Failed to delete record.');
    }
  };

  if (loading) {
    return (
      <AppShell>
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  if (!quote) {
    return (
      <AppShell>
        <PageContainer>
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-foreground">Quotation Not Found</h2>
            <p className="text-sm text-muted-foreground mt-2">The requested quotation document could not be located.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/quotations')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Quotations
            </Button>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Top Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => router.push('/quotations')} className="cursor-pointer">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" /> Quotation #{quote.quotationNumber}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="cursor-pointer">
                <Printer className="h-4 w-4 mr-1.5" /> Print Quotation
              </Button>

              {quote.status !== 'Converted' ? (
                <Button variant="primary" size="sm" onClick={handleConvert} isLoading={isConverting} className="cursor-pointer">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Convert to Sales Invoice
                </Button>
              ) : (
                <Badge variant="success" className="py-1 px-3">
                  <Sparkles className="h-3.5 w-3.5 mr-1" /> Converted to Sale
                </Badge>
              )}

              <Button variant="outline" size="sm" onClick={handleDelete} className="text-rose-500 hover:bg-rose-500/10 cursor-pointer">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Printable Quotation Paper Document */}
          <div className="bg-card border border-border/80 rounded-2xl shadow-sm p-8 space-y-6 print:border-none print:shadow-none print:p-0">
            
            {/* Header / Brand */}
            <div className="flex justify-between items-start border-b border-border/70 pb-6">
              <div>
                <div className="flex items-center gap-2 text-primary font-black text-2xl tracking-wider">
                  <FileCheck className="h-7 w-7" /> ENTERPRISE ERP
                </div>
                <p className="text-xs text-muted-foreground mt-1">High-Precision Electronics & IT Solutions Depot</p>
                <p className="text-xs text-muted-foreground">GSTIN: 27AAAAA0000A1Z5 | PAN: AAAAA0000A</p>
              </div>

              <div className="text-right">
                <h2 className="text-2xl font-black text-foreground uppercase tracking-wider">PROFORMA QUOTATION</h2>
                <div className="font-mono text-sm font-bold text-primary mt-1">{quote.quotationNumber}</div>
                <div className="text-xs text-muted-foreground mt-1">Date: {quote.date}</div>
                <div className="text-xs font-semibold text-amber-600">Valid Until: {quote.validUntil}</div>
              </div>
            </div>

            {/* Client & Warehouse Info */}
            <div className="grid grid-cols-2 gap-8 py-2">
              <div className="space-y-1 text-xs">
                <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] block mb-1">
                  Quotation Prepared For:
                </span>
                <p className="font-bold text-foreground text-sm">{quote.customerName}</p>
                {quote.customerPhone && <p className="text-muted-foreground">Phone: {quote.customerPhone}</p>}
                {quote.customerEmail && <p className="text-muted-foreground">Email: {quote.customerEmail}</p>}
                {quote.customerAddress && <p className="text-muted-foreground">Address: {quote.customerAddress}</p>}
              </div>

              <div className="space-y-1 text-xs text-right">
                <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] block mb-1">
                  Issuing Warehouse & Node:
                </span>
                <p className="font-bold text-foreground text-sm">{quote.warehouseName || 'Central Hub Warehouse'}</p>
                <p className="text-muted-foreground">Prepared By: {quote.preparedBy || 'Key Account Manager'}</p>
                <div className="pt-2">
                  <Badge variant={quote.status === 'Converted' || quote.status === 'Accepted' ? 'success' : 'outline'}>
                    Status: {quote.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="rounded-xl border border-border/70 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-bold border-b border-border/60">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Item & Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Discount</th>
                    <th className="p-3 text-right">GST Tax</th>
                    <th className="p-3 text-right">Net Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(quote.items || []).map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/5">
                      <td className="p-3 text-muted-foreground">{idx + 1}</td>
                      <td className="p-3 font-semibold text-foreground">
                        {item.productName}
                        {item.sku && <span className="text-[10px] text-muted-foreground block font-mono">SKU: {item.sku}</span>}
                      </td>
                      <td className="p-3 text-center font-bold">{item.quantity}</td>
                      <td className="p-3 text-right font-mono">₹{Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right font-mono text-emerald-600">
                        {item.discount > 0 ? `-₹${Number(item.discount).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        ₹{Number(item.tax || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-foreground">
                        ₹{Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Terms & Financial Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/70">
              <div className="space-y-3 text-xs text-muted-foreground">
                <div>
                  <span className="font-bold text-foreground block mb-1">Commercial Terms & Conditions:</span>
                  <p className="whitespace-pre-line bg-muted/20 p-3 rounded-xl border border-border/50">
                    {quote.terms || '1. Quotation valid for 30 calendar days.\n2. Payment terms as agreed on purchase order.'}
                  </p>
                </div>
                {quote.notes && (
                  <div>
                    <span className="font-bold text-foreground block mb-1">Remarks:</span>
                    <p className="text-muted-foreground">{quote.notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono text-foreground">₹{Number(quote.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {quote.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Total Discount:</span>
                    <span className="font-mono">-₹{Number(quote.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {quote.shipping > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping & Freight:</span>
                    <span className="font-mono text-foreground">+₹{Number(quote.shipping).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>GST / Tax Total:</span>
                  <span className="font-mono text-foreground">+₹{Number(quote.orderTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-black text-foreground pt-3 border-t-2 border-foreground/20">
                  <span>Grand Total (INR):</span>
                  <span className="font-mono text-primary text-xl">₹{Number(quote.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="flex justify-between items-end pt-12 text-xs text-muted-foreground">
              <div>
                <p>Authorized Client Acceptance Signature</p>
                <div className="w-48 border-b border-muted-foreground/40 mt-8"></div>
              </div>
              <div className="text-right">
                <p>For Enterprise Solutions Pvt Ltd</p>
                <div className="w-48 border-b border-muted-foreground/40 mt-8 ml-auto"></div>
                <p className="mt-1 text-[11px]">Authorized Signatory</p>
              </div>
            </div>

          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { 
  FileSpreadsheet, Plus, RefreshCw, Eye, FileText, Trash2, 
  DollarSign, CheckCircle2, TrendingUp, Calendar, ArrowRight, Printer, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToastStore } from '../../lib/store';

export default function QuotationsListPage() {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewQuote, setPreviewQuote] = useState<any | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/quotations');
      if (res.ok) {
        const data = await res.json();
        setQuotations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Fetch quotations error:', error);
      addToast('error', 'Fetch Error', 'Failed to retrieve quotations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleDelete = async (id: string, quoteNum: string) => {
    try {
      const res = await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Quotation Deleted', `${quoteNum} has been removed.`);
        setQuotations(prev => prev.filter(q => q._id !== id));
      } else {
        const err = await res.json();
        addToast('error', 'Delete Failed', err.error || 'Could not delete quotation.');
      }
    } catch (error) {
      addToast('error', 'Error', 'Failed to communicate with database.');
    }
  };

  const handleConvert = async (quote: any) => {
    if (quote.status === 'Converted') {
      addToast('info', 'Already Converted', 'This quotation has already been converted to a sales order.');
      return;
    }

    try {
      setIsConverting(true);
      const res = await fetch(`/api/quotations/${quote._id}/convert`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        addToast('success', 'Converted to Sale!', data.message);
        setQuotations(prev => prev.map(q => q._id === quote._id ? { ...q, status: 'Converted' } : q));
        if (previewQuote && previewQuote._id === quote._id) {
          setPreviewQuote((p: any) => ({ ...p, status: 'Converted' }));
        }
      } else {
        const err = await res.json();
        addToast('error', 'Conversion Failed', err.error || 'Could not convert to sale.');
      }
    } catch (error) {
      addToast('error', 'Error', 'Failed to convert quotation.');
    } finally {
      setIsConverting(false);
    }
  };

  const totalQuoted = quotations.reduce((acc, q) => acc + (Number(q.grandTotal) || 0), 0);
  const acceptedValue = quotations.filter(q => q.status === 'Accepted' || q.status === 'Converted').reduce((acc, q) => acc + (Number(q.grandTotal) || 0), 0);
  const convertedCount = quotations.filter(q => q.status === 'Converted').length;
  const activeProposals = quotations.filter(q => q.status === 'Sent' || q.status === 'Draft').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Converted':
        return <Badge variant="success" className="text-[11px]"><Sparkles className="h-3 w-3 mr-1" /> Converted to Sale</Badge>;
      case 'Accepted':
        return <Badge variant="success" className="text-[11px]">Accepted</Badge>;
      case 'Sent':
        return <Badge variant="info" className="text-[11px]">Sent to Client</Badge>;
      case 'Declined':
        return <Badge variant="destructive" className="text-[11px]">Declined</Badge>;
      default:
        return <Badge variant="outline" className="text-[11px]">Draft</Badge>;
    }
  };

  const columns = [
    {
      header: 'Quote # / Date',
      accessor: 'quotationNumber',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-xs text-primary">{row.quotationNumber}</span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="h-3 w-3" /> {row.date}
          </span>
        </div>
      )
    },
    {
      header: 'Client / Company',
      accessor: 'customerName',
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground">{row.customerName}</span>
          <span className="text-[11px] text-muted-foreground">{row.customerPhone || row.customerEmail || '—'}</span>
        </div>
      )
    },
    {
      header: 'Validity Expire',
      accessor: 'validUntil',
      render: (row: any) => (
        <span className="text-xs font-mono text-muted-foreground">
          {row.validUntil || '30 Days'}
        </span>
      )
    },
    {
      header: 'Items Quoted',
      accessor: 'items',
      render: (row: any) => (
        <span className="text-xs font-semibold text-foreground">
          {(row.items || []).length} items ({(row.items || []).reduce((a: number, i: any) => a + (Number(i.quantity) || 0), 0)} units)
        </span>
      )
    },
    {
      header: 'Grand Total',
      accessor: 'grandTotal',
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-sm text-foreground">
          ₹{Number(row.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row: any) => getStatusBadge(row.status)
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPreviewQuote(row)}
            className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Preview Quotation"
          >
            <Eye className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => router.push(`/quotations/${row._id}`)}
            className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Full Invoice View"
          >
            <FileText className="h-4.5 w-4.5" />
          </button>
          {row.status !== 'Converted' && (
            <button
              onClick={() => handleConvert(row)}
              className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
              title="Convert to Live Sales Order"
            >
              <CheckCircle2 className="h-4.5 w-4.5" />
            </button>
          )}
          <button
            onClick={() => handleDelete(row._id, row.quotationNumber)}
            className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Delete Record"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-6 w-6 text-primary" /> Sales Quotations & Proposals
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Draft client cost estimates, track proposal acceptance, and convert accepted quotes to live sales orders with 1-click.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchQuotations} disabled={loading} className="cursor-pointer">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={() => router.push('/quotations/create')} className="cursor-pointer">
                <Plus className="h-4 w-4" /> Create Quotation
              </Button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Quoted Value</span>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-foreground mt-2">
                ₹{totalQuoted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Across {quotations.length} proposals</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Accepted & Won Value</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-emerald-600 mt-2">
                ₹{acceptedValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Confirmed proposals</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Converted to Sales</span>
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-indigo-600 mt-2">
                {convertedCount} / {quotations.length}
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Converted into live orders</span>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Active in Pipeline</span>
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-amber-600 mt-2">
                {activeProposals} Open
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">Draft & awaiting signoff</span>
            </div>
          </div>

          {/* DataTable */}
          <DataTable
            data={quotations}
            columns={columns}
            searchKey="customerName"
            searchPlaceholder="Search customer, quote number..."
            filters={[
              { name: 'Status', key: 'status', options: ['Draft', 'Sent', 'Accepted', 'Declined', 'Converted'] }
            ]}
          />

          {/* Interactive Preview Modal */}
          {previewQuote && (
            <Modal
              isOpen={Boolean(previewQuote)}
              onClose={() => setPreviewQuote(null)}
              title={`Quotation Proposal — ${previewQuote.quotationNumber}`}
              size="lg"
            >
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-card border border-border/70 space-y-4">
                  
                  {/* Top Bar */}
                  <div className="flex justify-between items-start pb-3 border-b border-border/60">
                    <div>
                      <span className="text-xs font-bold text-primary font-mono">{previewQuote.quotationNumber}</span>
                      <h3 className="text-base font-bold text-foreground mt-0.5">{previewQuote.customerName}</h3>
                      <p className="text-muted-foreground text-[11px]">{previewQuote.customerPhone} • {previewQuote.customerEmail}</p>
                      {previewQuote.customerAddress && <p className="text-muted-foreground text-[11px]">{previewQuote.customerAddress}</p>}
                    </div>
                    <div className="text-right">
                      {getStatusBadge(previewQuote.status)}
                      <div className="text-[11px] text-muted-foreground mt-1">Date: {previewQuote.date}</div>
                      <div className="text-[11px] font-semibold text-amber-600">Valid Until: {previewQuote.validUntil}</div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div>
                    <span className="font-bold text-xs text-foreground block mb-2">Quoted Line Items:</span>
                    <div className="rounded-xl border border-border/70 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-muted/40 text-[11px] font-bold text-muted-foreground border-b border-border/50">
                          <tr>
                            <th className="p-2.5">Item Name</th>
                            <th className="p-2.5 text-center">Qty</th>
                            <th className="p-2.5 text-right">Unit Price</th>
                            <th className="p-2.5 text-right">Tax (GST)</th>
                            <th className="p-2.5 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {(previewQuote.items || []).map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-muted/10">
                              <td className="p-2.5 font-medium text-foreground">
                                {item.productName}
                                {item.sku && <span className="text-[10px] text-muted-foreground block font-mono">SKU: {item.sku}</span>}
                              </td>
                              <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                              <td className="p-2.5 text-right font-mono">₹{Number(item.unitPrice).toLocaleString('en-IN')}</td>
                              <td className="p-2.5 text-right font-mono text-muted-foreground">₹{Number(item.tax || 0).toLocaleString('en-IN')}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-foreground">₹{Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="flex justify-between items-end pt-3 border-t border-border/60">
                    <div className="max-w-xs text-[11px] text-muted-foreground">
                      <span className="font-bold text-foreground block mb-1">Terms & Conditions:</span>
                      <p>{previewQuote.terms || 'Standard corporate terms apply.'}</p>
                    </div>

                    <div className="w-56 space-y-1.5 text-right text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal:</span>
                        <span className="font-mono text-foreground">₹{Number(previewQuote.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {previewQuote.discount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Discount:</span>
                          <span className="font-mono">-₹{Number(previewQuote.discount).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-muted-foreground">
                        <span>GST / Taxes:</span>
                        <span className="font-mono text-foreground">+₹{Number(previewQuote.orderTax || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-base font-black text-foreground pt-1.5 border-t border-border">
                        <span>Grand Total:</span>
                        <span className="font-mono text-primary">₹{Number(previewQuote.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/quotations/${previewQuote._id}`)}>
                    <Printer className="h-4 w-4" /> Full Printable Invoice
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPreviewQuote(null)}>
                      Close
                    </Button>
                    {previewQuote.status !== 'Converted' && (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => handleConvert(previewQuote)} 
                        isLoading={isConverting}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Convert to Sales Order
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Modal>
          )}

        </div>
      </PageContainer>
    </AppShell>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  BadgeAlert, Plus, Eye, Trash2, CheckCircle2, 
  FileText, IndianRupee, RefreshCw, Printer, AlertCircle, ArrowUpRight, ShieldCheck, Check
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const debitSchema = z.object({
  noteNo: z.string().min(5, { message: 'Debit Note No is required' }),
  purchaseNo: z.string().min(3, { message: 'Purchase number is required' }),
  supplierName: z.string().min(2, { message: 'Supplier name is required' }),
  debitAmount: z.number().min(0.01, { message: 'Debit amount must be positive' }),
  reason: z.string().min(3, { message: 'Reason is required' })
});

export default function DebitNotesPage() {
  const { addToast } = useToastStore();
  const [debitNotes, setDebitNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(debitSchema),
    defaultValues: {
      noteNo: 'DN-2026-' + Math.floor(1000 + Math.random() * 9000),
      purchaseNo: 'PUR-2026-',
      supplierName: '',
      debitAmount: 0,
      reason: ''
    }
  });

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/credit-debit-notes');
      const data = await res.json();
      if (data && Array.isArray(data.debitNotes)) {
        setDebitNotes(data.debitNotes);
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Fetch Error', 'Failed to load debit notes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        type: 'debit',
        data: {
          ...data,
          status: 'Issued',
          date: new Date().toISOString().split('T')[0]
        }
      };

      const res = await fetch('/api/credit-debit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to issue debit note');
      }

      addToast('success', 'Debit Note Issued', `Debit Note ${data.noteNo} recorded to MongoDB.`);
      setIsModalOpen(false);
      reset({
        noteNo: 'DN-2026-' + Math.floor(1000 + Math.random() * 9000),
        purchaseNo: 'PUR-2026-',
        supplierName: '',
        debitAmount: 0,
        reason: ''
      });
      loadNotes();
    } catch (err: any) {
      addToast('error', 'Issuance Failed', err.message);
    }
  };

  const handleToggleStatus = async (note: any) => {
    const nextStatus = note.status === 'Issued' ? 'Adjusted' : 'Issued';
    try {
      const res = await fetch('/api/credit-debit-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: note._id,
          type: 'debit',
          status: nextStatus
        })
      });
      if (!res.ok) throw new Error('Status update failed');
      addToast('success', 'Status Updated', `${note.noteNo} marked as ${nextStatus}`);
      loadNotes();
    } catch (err: any) {
      addToast('error', 'Update Error', err.message);
    }
  };

  const handleDelete = async (id: string, noteNo: string) => {
    try {
      const res = await fetch(`/api/credit-debit-notes?id=${id}&type=debit`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Delete failed');
      addToast('success', 'Deleted', `Debit Note ${noteNo} removed.`);
      loadNotes();
    } catch (err: any) {
      addToast('error', 'Delete Error', err.message);
    }
  };

  // Metric aggregates
  const totalCount = debitNotes.length;
  const totalDebitVal = debitNotes.reduce((acc, n) => acc + (Number(n.debitAmount) || 0), 0);
  const totalAdjustedVal = debitNotes
    .filter(n => n.status === 'Adjusted' || n.status === 'Refunded')
    .reduce((acc, n) => acc + (Number(n.debitAmount) || 0), 0);
  const openDebitsVal = totalDebitVal - totalAdjustedVal;

  const columns = [
    { 
      header: 'Note Number', 
      accessor: 'noteNo', 
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded text-xs">
          {row.noteNo}
        </span>
      )
    },
    { 
      header: 'Purchase Ref', 
      accessor: 'purchaseNo', 
      sortable: true,
      render: (row: any) => <span className="font-medium text-xs text-foreground/90">{row.purchaseNo || 'N/A'}</span>
    },
    { 
      header: 'Supplier Name', 
      accessor: 'supplierName', 
      sortable: true,
      render: (row: any) => <span className="font-semibold text-foreground text-xs">{row.supplierName}</span>
    },
    { 
      header: 'Debit Amount', 
      accessor: 'debitAmount', 
      sortable: true,
      render: (row: any) => <span className="font-extrabold text-foreground text-xs">₹{(Number(row.debitAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> 
    },
    { 
      header: 'Reason / Notes', 
      accessor: 'reason',
      render: (row: any) => <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]" title={row.reason}>{row.reason}</span>
    },
    { header: 'Date Issued', accessor: 'date', sortable: true },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (row: any) => (
        <Badge variant={row.status === 'Adjusted' ? 'success' : row.status === 'Settled' ? 'info' : 'warning'}>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSelectedNote(row);
              setIsViewModalOpen(true);
            }}
            className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="View Voucher Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(row)}
            className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title={row.status === 'Issued' ? 'Mark as Adjusted' : 'Mark as Issued'}
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row._id, row.noteNo)}
            className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Delete Note"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between select-none border-b border-border pb-4 gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <BadgeAlert className="h-6 w-6 text-violet-600 dark:text-violet-400" /> Debit Notes (Supplier Return Claims)
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Manage supplier claims, damaged return bills, and purchase deductions recorded to MongoDB.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadNotes} className="h-9 gap-1.5 text-xs font-semibold">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" onClick={() => setIsModalOpen(true)} className="h-9 font-bold text-xs gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> Issue Debit Note
              </Button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border shadow-xs hover:border-violet-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Debit Notes</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{totalCount}</p>
                  <span className="text-[10px] text-violet-500 font-medium mt-0.5 block">Issued claims</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-purple-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Claims Value</p>
                  <p className="text-2xl font-bold text-foreground mt-1">₹{totalDebitVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-purple-500 font-medium mt-0.5 block">Debit receivable</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-emerald-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Adjusted / Recovered</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{totalAdjustedVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Settled with suppliers</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-amber-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Claims</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">₹{openDebitsVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">Open balance</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DataTable */}
          <DataTable
            title="Debit Notes Log"
            data={debitNotes}
            columns={columns}
            searchKey="noteNo"
            searchPlaceholder="Search by Note #, Supplier, or Purchase Ref..."
          />
        </div>

        {/* ISSUE DEBIT NOTE MODAL */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Issue Debit Note (Supplier Return Claim)"
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs select-none">
            <div className="bg-violet-500/5 p-3 rounded-lg border border-violet-500/20 text-muted-foreground text-xs leading-relaxed">
              Issue a debit note to claim deduction on purchase bills due to damaged freight, supplier quantity shortages, or rate discrepancies.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Note No</label>
                <input {...register('noteNo')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                {errors.noteNo && <p className="text-rose-500 text-[10px]">{errors.noteNo.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Purchase Reference</label>
                <input {...register('purchaseNo')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="PUR-2026-XXXX" />
                {errors.purchaseNo && <p className="text-rose-500 text-[10px]">{errors.purchaseNo.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Supplier Name</label>
                <input {...register('supplierName')} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" placeholder="e.g. Indo Global Importers" />
                {errors.supplierName && <p className="text-rose-500 text-[10px]">{errors.supplierName.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground">Claim / Debit Amount (₹)</label>
                <input type="number" step="0.01" {...register('debitAmount', { valueAsNumber: true })} className="h-9 w-full rounded border border-border px-3 text-sm focus:outline-none bg-card text-foreground" />
                {errors.debitAmount && <p className="text-rose-500 text-[10px]">{errors.debitAmount.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-muted-foreground">Reason / Goods Discrepancy Details</label>
              <textarea {...register('reason')} className="h-20 w-full rounded border border-border p-3 text-sm focus:outline-none bg-card text-foreground" placeholder="Describe returned cargo, quality defects, shortage, or discount difference..." />
              {errors.reason && <p className="text-rose-500 text-[10px]">{errors.reason.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>Issue Debit Note</Button>
            </div>
          </form>
        </Modal>

        {/* VOUCHER PREVIEW MODAL */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Debit Note Voucher"
          size="lg"
        >
          {selectedNote && (
            <div className="space-y-5 text-foreground">
              {/* Voucher Top Banner */}
              <div className="p-4 bg-muted/30 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black tracking-tight">{selectedNote.noteNo}</h2>
                    <Badge variant={selectedNote.status === 'Adjusted' ? 'success' : 'warning'}>
                      {selectedNote.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Date Issued: {selectedNote.date || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Claim Deduction</p>
                  <p className="text-2xl font-black text-violet-600 dark:text-violet-400">₹{(Number(selectedNote.debitAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-4 bg-card p-4 rounded-xl border border-border text-xs">
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Supplier Details</p>
                  <p className="font-bold text-sm text-foreground">{selectedNote.supplierName}</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">Purchase Ref: <span className="font-mono font-medium text-foreground">{selectedNote.purchaseNo || 'N/A'}</span></p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Adjustment Type</p>
                  <p className="font-bold text-sm text-foreground">Purchase Return Deduction</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">MongoDB ID: <span className="font-mono text-[10px]">{selectedNote._id}</span></p>
                </div>
              </div>

              {/* Reason box */}
              <div className="p-3.5 bg-muted/20 border border-border rounded-xl">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Claim / Deduction Description</p>
                <p className="text-xs text-foreground/90 leading-relaxed">{selectedNote.reason || 'No specific reason recorded.'}</p>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
                  <Printer className="h-4 w-4" /> Print Voucher
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant={selectedNote.status === 'Issued' ? 'primary' : 'outline'} 
                    size="sm"
                    onClick={() => {
                      handleToggleStatus(selectedNote);
                      setIsViewModalOpen(false);
                    }}
                  >
                    {selectedNote.status === 'Issued' ? 'Mark as Adjusted / Settled' : 'Mark as Open Claim'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>

      </PageContainer>
    </AppShell>
  );
}

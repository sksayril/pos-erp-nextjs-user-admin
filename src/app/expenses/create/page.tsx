'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useRouter } from 'next/navigation';
import { useToastStore } from '../../../lib/store';
import { Receipt, ArrowLeft, Building2, Tag, CreditCard, Calendar, FileText, CheckCircle2 } from 'lucide-react';

export default function CreateExpensePage() {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [categories, setCategories] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category: '',
    categoryId: '',
    amount: '',
    taxAmount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    paidBy: 'Accounts Lead',
    vendor: '',
    reference: '',
    warehouseName: 'Central Hub Warehouse',
    description: ''
  });

  useEffect(() => {
    async function loadMeta() {
      try {
        const [resCat, resWh] = await Promise.all([
          fetch('/api/expenses/categories'),
          fetch('/api/settings/warehouse')
        ]);
        if (resCat.ok) {
          const cats = await resCat.json();
          setCategories(Array.isArray(cats) ? cats : []);
          if (cats.length > 0) {
            setForm(f => ({ ...f, category: cats[0].name, categoryId: cats[0]._id }));
          }
        }
        if (resWh.ok) {
          const whs = await resWh.json();
          setWarehouses(Array.isArray(whs) ? whs : []);
        }
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    }
    loadMeta();
  }, []);

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const catObj = categories.find(c => c.name === selectedName);
    setForm(f => ({
      ...f,
      category: selectedName,
      categoryId: catObj ? catObj._id : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      addToast('error', 'Validation Error', 'Expense title is required.');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      addToast('error', 'Validation Error', 'Please enter a valid expense amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          taxAmount: Number(form.taxAmount) || 0
        })
      });

      if (res.ok) {
        const created = await res.json();
        addToast('success', 'Expense Recorded', `Voucher ${created.expenseNumber || ''} has been created successfully.`);
        router.push('/expenses');
      } else {
        const err = await res.json();
        addToast('error', 'Submission Failed', err.error || 'Failed to record expense.');
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
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => router.back()} className="h-9 w-9 p-0 cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Receipt className="h-6 w-6 text-primary" /> Create Operating Expense
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Record new business expenditures, utility bills, facility rents, and vendor disbursements.
                </p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <Card className="border border-border/80 bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/60 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <FileText className="h-4 w-4 text-primary" /> Expense Voucher Details
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Main Information */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-primary" /> Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-foreground block mb-1.5">Expense Title / Description Header *</label>
                      <input
                        type="text"
                        required
                        value={form.title}
                        onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Monthly Warehouse Electricity Bill & AC Servicing"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1.5">Expense Category *</label>
                      <select
                        value={form.category}
                        onChange={handleCategorySelect}
                        required
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {categories.map((c) => (
                          <option key={c._id || c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1.5">Billing Date *</label>
                      <input
                        type="date"
                        required
                        value={form.date}
                        onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Values */}
                <div className="pt-4 border-t border-border/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-primary" /> Financials & Payment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1.5">Expense Amount (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={form.amount}
                        onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                        placeholder="0.00"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-mono font-bold text-rose-600 dark:text-rose-400 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1.5">Tax / GST Included (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.taxAmount}
                        onChange={(e) => setForm(f => ({ ...f, taxAmount: e.target.value }))}
                        placeholder="0.00"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-mono font-bold text-amber-600 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1.5">Payment Method</label>
                      <select
                        value={form.paymentMethod}
                        onChange={(e) => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="UPI">UPI / QR Code</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1.5">Payment Status</label>
                      <select
                        value={form.paymentStatus}
                        onChange={(e) => setForm(f => ({ ...f, paymentStatus: e.target.value }))}
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1.5">Payee / Vendor Name</label>
                      <input
                        type="text"
                        value={form.vendor}
                        onChange={(e) => setForm(f => ({ ...f, vendor: e.target.value }))}
                        placeholder="e.g. State Power Board, Landlord"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1.5">Bill / Receipt Reference #</label>
                      <input
                        type="text"
                        value={form.reference}
                        onChange={(e) => setForm(f => ({ ...f, reference: e.target.value }))}
                        placeholder="e.g. BILL-99201"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Warehouse & Branch */}
                <div className="pt-4 border-t border-border/50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" /> Branch & Allocation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1.5">Operating Branch / Warehouse</label>
                      <select
                        value={form.warehouseName}
                        onChange={(e) => setForm(f => ({ ...f, warehouseName: e.target.value }))}
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="Central Hub Warehouse">Central Hub Warehouse</option>
                        {warehouses.map((wh) => (
                          <option key={wh._id || wh.id} value={wh.name}>{wh.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1.5">Disbursed / Paid By</label>
                      <input
                        type="text"
                        value={form.paidBy}
                        onChange={(e) => setForm(f => ({ ...f, paidBy: e.target.value }))}
                        placeholder="Staff / Officer name"
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="pt-4 border-t border-border/50">
                  <label className="text-xs font-bold text-foreground block mb-1.5">Internal Remarks / Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Add purpose, payment terms, or notes..."
                    className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Submit buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="cursor-pointer">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={isSubmitting} className="cursor-pointer">
                    <CheckCircle2 className="h-4 w-4" /> Save Expense Voucher
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { useToastStore } from '../../../lib/store';
import { 
  DollarSign, Calendar, CheckCircle2, AlertCircle, 
  Printer, Download, Search, Filter, Plus, FileText, 
  CreditCard, Sparkles, Building2, Check, ArrowRight 
} from 'lucide-react';

export default function SalaryPage() {
  const { addToast } = useToastStore();

  const [selectedMonth, setSelectedMonth] = useState('September 2026');
  const [salaries, setSalaries] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [payslipModalData, setPayslipModalData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // New Payroll Form
  const [empId, setEmpId] = useState('');
  const [basic, setBasic] = useState('35000');
  const [allowance, setAllowance] = useState('5000');
  const [deductions, setDeductions] = useState('1500');
  const [tax, setTax] = useState('2000');
  const [payMethod, setPayMethod] = useState('Bank Transfer');

  // Fetch Payroll Data
  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hrm/salary?month=${encodeURIComponent(selectedMonth)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSalaries(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Employees
  useEffect(() => {
    fetch('/api/hrm/employees')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEmployees(data);
          if (data.length > 0) {
            setEmpId(data[0].employeeId);
            setBasic(data[0].salary?.toString() || '35000');
          }
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetchSalaries();
  }, [selectedMonth]);

  // Mark Salary as Paid
  const handleMarkPaid = async (item: any) => {
    try {
      const res = await fetch('/api/hrm/salary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: item._id,
          payrollId: item.payrollId,
          paymentStatus: 'Paid',
          paidDate: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        setSalaries(prev => prev.map(s => s._id === item._id ? { ...s, paymentStatus: 'Paid', paidDate: new Date().toISOString().split('T')[0] } : s));
        addToast('success', 'Salary Paid', `Disbursement marked as Paid for ${item.employeeName}.`);
      }
    } catch {
      addToast('error', 'Error', 'Failed to update payment status.');
    }
  };

  // Helper function to convert number to words (Indian / International currency)
  const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
    str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'Rupees Only' : 'Rupees Only';
    return str;
  };

  // Dedicated Clean Printable A4 Payslip Generator
  const handlePrintPayslipPDF = (data: any) => {
    if (!data) return;

    const basicVal = Number(data.basicSalary || 0);
    const allowVal = Number(data.allowance || 0);
    const deductVal = Number(data.deductions || 0);
    const taxVal = Number(data.tax || 0);
    const netVal = Number(data.netSalary || 0);
    const grossVal = basicVal + allowVal;
    const totalDeductVal = deductVal + taxVal;
    const words = numberToWords(Math.round(netVal));

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payslip - ${data.employeeName} - ${data.month}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          body {
            color: #1e293b;
            background: #fff;
            padding: 0;
            margin: 0;
            font-size: 12px;
            line-height: 1.4;
          }
          .payslip-container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #0f172a;
            padding: 24px;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
          .company-logo {
            font-size: 22px;
            font-weight: 900;
            color: #4338ca;
            letter-spacing: -0.5px;
          }
          .company-details {
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
          }
          .slip-title {
            text-align: right;
          }
          .slip-title h2 {
            margin: 0;
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .badge {
            display: inline-block;
            padding: 3px 10px;
            font-size: 10px;
            font-weight: 800;
            border-radius: 9999px;
            text-transform: uppercase;
            margin-top: 6px;
          }
          .badge-paid {
            background: #dcfce7;
            color: #166534;
            border: 1px solid #86efac;
          }
          .badge-pending {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
          }
          .emp-details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 18px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            font-size: 11.5px;
            padding: 2px 0;
          }
          .detail-label {
            color: #64748b;
            font-weight: 600;
          }
          .detail-value {
            font-weight: 700;
            color: #0f172a;
          }
          .salary-tables-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 18px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11.5px;
          }
          th {
            background: #f1f5f9;
            color: #0f172a;
            text-align: left;
            padding: 8px 10px;
            font-weight: 800;
            border-bottom: 1.5px solid #cbd5e1;
            font-size: 11px;
            text-transform: uppercase;
          }
          td {
            padding: 7px 10px;
            border-bottom: 1px solid #f1f5f9;
          }
          .amount-col {
            text-align: right;
            font-family: "Courier New", Courier, monospace;
            font-weight: 700;
          }
          .total-row {
            background: #f8fafc;
            font-weight: 800;
            border-top: 1.5px solid #cbd5e1;
          }
          .net-pay-banner {
            background: #eef2ff;
            border: 1.5px solid #c7d2fe;
            border-radius: 8px;
            padding: 14px 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 18px;
          }
          .net-pay-label {
            font-size: 13px;
            font-weight: 800;
            color: #3730a3;
            text-transform: uppercase;
          }
          .net-pay-words {
            font-size: 10.5px;
            color: #4f46e5;
            font-style: italic;
            margin-top: 2px;
          }
          .net-pay-val {
            font-size: 20px;
            font-weight: 900;
            color: #312e81;
            font-family: "Courier New", Courier, monospace;
          }
          .signatures-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 40px;
            padding-top: 20px;
          }
          .sig-box {
            text-align: center;
            border-top: 1px dashed #94a3b8;
            padding-top: 8px;
            font-size: 11px;
            font-weight: 700;
            color: #475569;
          }
          .footer-note {
            text-align: center;
            font-size: 9.5px;
            color: #94a3b8;
            margin-top: 24px;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="payslip-container">
          
          <!-- Company Header -->
          <div class="header">
            <div>
              <div class="company-logo">POS ERP ENTERPRISE</div>
              <div class="company-details">
                Apex Retail Systems Pvt. Ltd.<br/>
                Sector 5, Salt Lake, Kolkata - 700091<br/>
                GSTIN: 19AAACE5522E1Z2 | support@pos-erp.com
              </div>
            </div>
            <div class="slip-title">
              <h2>Salary Payslip</h2>
              <div style="font-size: 12px; font-weight: 700; color: #4338ca; margin-top: 2px;">
                Month: ${data.month}
              </div>
              <div style="font-size: 10px; font-family: monospace; color: #64748b; margin-top: 2px;">
                Slip Ref: ${data.payrollId}
              </div>
              <span class="badge ${data.paymentStatus === 'Paid' ? 'badge-paid' : 'badge-pending'}">
                ${data.paymentStatus === 'Paid' ? '✓ Disbursed (Paid)' : '⏳ Payment Pending'}
              </span>
            </div>
          </div>

          <!-- Employee Information -->
          <div class="emp-details-grid">
            <div>
              <div class="detail-row">
                <span class="detail-label">Employee Name:</span>
                <span class="detail-value">${data.employeeName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Employee ID:</span>
                <span class="detail-value">${data.employeeId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Department:</span>
                <span class="detail-value">${data.department}</span>
              </div>
            </div>
            <div>
              <div class="detail-row">
                <span class="detail-label">Payment Mode:</span>
                <span class="detail-value">${data.paymentMethod || 'Bank Transfer'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Disbursement Date:</span>
                <span class="detail-value">${data.paidDate || new Date().toISOString().split('T')[0]}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Currency:</span>
                <span class="detail-value">INR (₹)</span>
              </div>
            </div>
          </div>

          <!-- Earnings & Deductions Tables -->
          <div class="salary-tables-grid">
            <!-- Earnings -->
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Earnings (Income)</th>
                    <th class="amount-col">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Basic Monthly Pay</td>
                    <td class="amount-col">₹${basicVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td>Special / Performance Allowance</td>
                    <td class="amount-col">₹${allowVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr class="total-row">
                    <td>Total Gross Earnings</td>
                    <td class="amount-col">₹${grossVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Deductions -->
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Deductions</th>
                    <th class="amount-col">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Provident Fund (PF) & Insurance</td>
                    <td class="amount-col">₹${deductVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td>Income Tax / TDS Withholding</td>
                    <td class="amount-col">₹${taxVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr class="total-row">
                    <td>Total Deductions</td>
                    <td class="amount-col">₹${totalDeductVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Net Pay Summary Banner -->
          <div class="net-pay-banner">
            <div>
              <div class="net-pay-label">Net Take-Home Salary</div>
              <div class="net-pay-words">${words}</div>
            </div>
            <div class="net-pay-val">
              ₹${netVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <!-- Signatures -->
          <div class="signatures-grid">
            <div class="sig-box">
              Employee Signature / Acknowledgment
            </div>
            <div class="sig-box">
              Authorized Signatory (HR / Finance Manager)
            </div>
          </div>

          <!-- Footer -->
          <div class="footer-note">
            This is a computer-generated official payroll advice and does not require a physical seal if digitally authenticated.<br/>
            Generated on: ${new Date().toLocaleString()} | POS ERP Enterprise Platform
          </div>

        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printHtml);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  // Generate new entry
  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const emp = employees.find(e => e.employeeId === empId);

    try {
      const res = await fetch('/api/hrm/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          employeeName: emp?.name || 'Employee',
          department: emp?.department || 'General',
          month: selectedMonth,
          basicSalary: Number(basic),
          allowance: Number(allowance),
          deductions: Number(deductions),
          tax: Number(tax),
          paymentMethod: payMethod
        })
      });

      if (res.ok) {
        addToast('success', 'Payroll Entry Created', `Generated payslip sheet for ${emp?.name || empId}.`);
        setGenerateModalOpen(false);
        fetchSalaries();
      }
    } catch {
      addToast('error', 'Failed', 'Error creating payroll entry.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter list
  const filteredSalaries = salaries.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || s.employeeName?.toLowerCase().includes(q) || s.employeeId?.toLowerCase().includes(q) || s.department?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || s.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI calculations
  const totalNetPayroll = salaries.reduce((sum, s) => sum + (Number(s.netSalary) || 0), 0);
  const paidPayroll = salaries.filter(s => s.paymentStatus === 'Paid').reduce((sum, s) => sum + (Number(s.netSalary) || 0), 0);
  const pendingCount = salaries.filter(s => s.paymentStatus === 'Pending').length;
  const paidCount = salaries.filter(s => s.paymentStatus === 'Paid').length;

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6 select-none">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight">Salary Sheets &amp; Payroll</h1>
                <p className="text-xs text-muted-foreground">Manage employee disbursements, tax withholdings, allowances &amp; payslips.</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="September 2026">September 2026</option>
                <option value="August 2026">August 2026</option>
                <option value="July 2026">July 2026</option>
                <option value="October 2026">October 2026</option>
              </select>

              <Button
                variant="primary"
                onClick={() => setGenerateModalOpen(true)}
                className="gap-2 h-10 px-4 rounded-xl shadow-md font-bold cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Generate Payroll</span>
              </Button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Total Net Payroll</span>
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-black text-foreground">₹{totalNetPayroll.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">For {selectedMonth}</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Disbursed (Paid)</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{paidPayroll.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">{paidCount} employees credited</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Pending Payouts</span>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingCount}</p>
              <p className="text-[11px] text-muted-foreground">Awaiting bank dispatch</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Total Payslips</span>
                <FileText className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{salaries.length}</p>
              <p className="text-[11px] text-muted-foreground">Generated sheets</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Employee, ID or Department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-muted/20 pl-9 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Payout Status:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Payouts</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Salary Table */}
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-extrabold">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Basic Salary</th>
                    <th className="py-3.5 px-4">Allowance (+)</th>
                    <th className="py-3.5 px-4">Deductions / Tax (-)</th>
                    <th className="py-3.5 px-4">Net Payout</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span>Loading salary sheets...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSalaries.length > 0 ? (
                    filteredSalaries.map((s) => (
                      <tr key={s._id || s.payrollId} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                              {s.employeeName?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{s.employeeName}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{s.employeeId} • {s.payrollId}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-foreground">
                          {s.department}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          ₹{Number(s.basicSalary || 0).toLocaleString()}
                        </td>

                        <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          +₹{Number(s.allowance || 0).toLocaleString()}
                        </td>

                        <td className="py-3 px-4 font-mono text-rose-500 font-semibold">
                          -₹{(Number(s.deductions || 0) + Number(s.tax || 0)).toLocaleString()}
                        </td>

                        <td className="py-3 px-4 font-mono font-black text-sm text-foreground">
                          ₹{Number(s.netSalary || 0).toLocaleString()}
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant={s.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                            {s.paymentStatus}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPayslipModalData(s)}
                              className="h-8 px-2.5 text-[10px] font-bold gap-1"
                              title="View Payslip"
                            >
                              <Printer className="h-3 w-3 text-primary" />
                              <span>Payslip</span>
                            </Button>

                            {s.paymentStatus === 'Pending' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleMarkPaid(s)}
                                className="h-8 px-2.5 text-[10px] font-bold gap-1 cursor-pointer"
                              >
                                <Check className="h-3 w-3" />
                                <span>Mark Paid</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        <DollarSign className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="font-semibold text-xs text-foreground">No payroll entries found for {selectedMonth}</p>
                        <p className="text-[11px]">Click &quot;Generate Payroll&quot; to calculate salary sheets.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* 1. PAYSLIP MODAL / RECEIPT PRINT VIEW */}
        <Modal
          isOpen={!!payslipModalData}
          onClose={() => setPayslipModalData(null)}
          title="Official Employee Salary Payslip"
          size="md"
        >
          {payslipModalData && (
            <div className="space-y-4 select-none text-xs">
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">{payslipModalData.employeeName}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">ID: {payslipModalData.employeeId} | Dept: {payslipModalData.department}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-muted-foreground block">Ref: {payslipModalData.payrollId}</span>
                    <Badge variant={payslipModalData.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                      {payslipModalData.paymentStatus}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Basic Salary</span>
                    <span className="font-bold text-foreground">₹{Number(payslipModalData.basicSalary).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40 text-emerald-600 dark:text-emerald-400">
                    <span>Performance Allowance (+)</span>
                    <span>+₹{Number(payslipModalData.allowance || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40 text-rose-500">
                    <span>Provident / Insurance Deductions (-)</span>
                    <span>-₹{Number(payslipModalData.deductions || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40 text-rose-500">
                    <span>Income Tax / TDS Withheld (-)</span>
                    <span>-₹{Number(payslipModalData.tax || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 font-black text-sm text-foreground bg-primary/5 px-2 rounded-lg mt-2">
                    <span>Net Disbursed Salary:</span>
                    <span className="text-primary">₹{Number(payslipModalData.netSalary).toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground flex justify-between pt-1">
                  <span>Month: <strong>{payslipModalData.month}</strong></span>
                  <span>Payment: <strong>{payslipModalData.paymentMethod || 'Bank Transfer'}</strong></span>
                </div>
              </div>

              <div className="border-t border-border/50 pt-3 flex items-center justify-end gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => handlePrintPayslipPDF(payslipModalData)} 
                  className="gap-1.5 font-bold cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 text-primary" />
                  <span>Print / Save PDF</span>
                </Button>
                <Button 
                  type="button"
                  variant="primary" 
                  onClick={() => setPayslipModalData(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* 2. GENERATE PAYROLL MODAL */}
        <Modal
          isOpen={generateModalOpen}
          onClose={() => setGenerateModalOpen(false)}
          title="Create Payroll Sheet Entry"
          size="md"
        >
          <form onSubmit={handleCreatePayroll} className="space-y-4 select-none text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Employee *</label>
              <select
                value={empId}
                onChange={(e) => {
                  setEmpId(e.target.value);
                  const found = employees.find(emp => emp.employeeId === e.target.value);
                  if (found) setBasic(found.salary?.toString() || '35000');
                }}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.name} ({emp.employeeId} - {emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Basic Salary (₹) *</label>
                <input
                  type="number"
                  required
                  value={basic}
                  onChange={(e) => setBasic(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Allowances (₹)</label>
                <input
                  type="number"
                  value={allowance}
                  onChange={(e) => setAllowance(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground">Deductions (₹)</label>
                <input
                  type="number"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground">Taxes (₹)</label>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between font-mono font-bold">
              <span>Calculated Net Salary:</span>
              <span className="text-primary text-sm font-black">
                ₹{(Number(basic) + Number(allowance) - Number(deductions) - Number(tax)).toLocaleString()}
              </span>
            </div>

            <div className="border-t border-border/50 pt-3 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setGenerateModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isProcessing}>Generate Payslip</Button>
            </div>
          </form>
        </Modal>

      </PageContainer>
    </AppShell>
  );
}
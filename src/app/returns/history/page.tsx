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
  History, RotateCcw, Truck, FileText, IndianRupee, 
  RefreshCw, Eye, Printer, PieChart, ShieldAlert, CheckCircle2,
  TrendingDown, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

export default function ReturnHistoryPage() {
  const { addToast } = useToastStore();
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'sales' | 'purchases'>('all');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/returns/history');
      const data = await res.json();
      setHistoryData(data);
    } catch (err) {
      console.error(err);
      addToast('error', 'Fetch Error', 'Failed to load return history log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const salesList = (historyData?.salesReturns || []).map((item: any) => ({
    ...item,
    activityType: 'Sales Return',
    partyName: item.customerName || 'Walk-in Customer',
    refNo: item.invoiceNo || 'N/A',
    itemCount: Array.isArray(item.items) ? item.items.length : 1,
    returnDate: item.date || item.createdAt?.split('T')[0] || 'N/A'
  }));

  const purchaseList = (historyData?.purchaseReturns || []).map((item: any) => ({
    ...item,
    activityType: 'Purchase Return',
    partyName: item.supplierName || 'Default Supplier',
    refNo: item.purchaseNo || 'N/A',
    itemCount: Array.isArray(item.items) ? item.items.length : 1,
    returnDate: item.date || item.createdAt?.split('T')[0] || 'N/A'
  }));

  let combinedRecords: any[] = [];
  if (activeTab === 'sales') {
    combinedRecords = salesList;
  } else if (activeTab === 'purchases') {
    combinedRecords = purchaseList;
  } else {
    combinedRecords = [...salesList, ...purchaseList].sort((a, b) => {
      const dateA = new Date(a.returnDate).getTime() || 0;
      const dateB = new Date(b.returnDate).getTime() || 0;
      return dateB - dateA;
    });
  }

  const columns = [
    { 
      header: 'Return Type', 
      accessor: 'activityType',
      sortable: true,
      render: (row: any) => (
        <Badge variant={row.activityType === 'Sales Return' ? 'info' : 'warning'}>
          {row.activityType === 'Sales Return' ? (
            <span className="flex items-center gap-1"><ArrowDownLeft className="h-3 w-3" /> Sales Return</span>
          ) : (
            <span className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> Purchase Return</span>
          )}
        </Badge>
      )
    },
    { 
      header: 'Return No / RMA', 
      accessor: 'returnNo', 
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-foreground text-xs">
          {row.returnNo}
        </span>
      )
    },
    { 
      header: 'Customer / Supplier', 
      accessor: 'partyName', 
      sortable: true,
      render: (row: any) => <span className="font-semibold text-foreground text-xs">{row.partyName}</span>
    },
    { 
      header: 'Reference #', 
      accessor: 'refNo', 
      sortable: true,
      render: (row: any) => <span className="font-mono text-xs text-muted-foreground">{row.refNo}</span>
    },
    { 
      header: 'Reason / RMA Category', 
      accessor: 'reason',
      render: (row: any) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
          {row.reason || 'General Return'}
        </span>
      )
    },
    { 
      header: 'Items', 
      accessor: 'itemCount',
      render: (row: any) => <span className="font-medium text-xs text-foreground">{row.itemCount} item(s)</span>
    },
    { 
      header: 'Total Value', 
      accessor: 'totalAmount', 
      sortable: true,
      render: (row: any) => <span className="font-extrabold text-foreground text-xs">₹{(Number(row.totalAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> 
    },
    { header: 'Date', accessor: 'returnDate', sortable: true },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (row: any) => (
        <Badge variant={row.status === 'Completed' || row.status === 'Approved' ? 'success' : row.status === 'Refunded' ? 'info' : 'warning'}>
          {row.status || 'Processed'}
        </Badge>
      )
    },
    {
      header: 'Action',
      accessor: '_id',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSelectedRecord(row);
              setIsDetailModalOpen(true);
            }}
            className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Inspect RMA Record"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const reasonList = Object.entries(historyData?.reasonBreakdown || {});

  return (
    <AppShell>
      <PageContainer>
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between select-none border-b border-border pb-4 gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <History className="h-6 w-6 text-primary" /> Return History & RMA Audit Log
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Comprehensive audit trail of customer sales returns, supplier purchase returns, and notes generated.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchHistory} className="h-9 gap-1.5 text-xs font-semibold">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Log
              </Button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sales Returns</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    ₹{(Number(historyData?.totalSalesReturnValue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-primary font-medium mt-0.5 block">{historyData?.totalSalesReturnCount || 0} customer claims</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <RotateCcw className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-amber-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Purchase Returns</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    ₹{(Number(historyData?.totalPurchaseReturnValue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 block">{historyData?.totalPurchaseReturnCount || 0} vendor dispatches</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Truck className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-blue-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Credit Notes Issued</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{historyData?.totalCreditNotesIssued || 0}</p>
                  <span className="text-[10px] text-blue-500 font-medium mt-0.5 block">Customer refund notes</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-xs hover:border-purple-500/40 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Debit Notes Issued</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{historyData?.totalDebitNotesIssued || 0}</p>
                  <span className="text-[10px] text-purple-500 font-medium mt-0.5 block">Vendor deduction notes</span>
                </div>
                <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reason Analytics Ribbon */}
          {reasonList.length > 0 && (
            <Card className="border-border bg-card/60 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <PieChart className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Top Return Reasons Frequency</h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {reasonList.map(([reason, count]) => (
                    <div key={reason} className="flex items-center gap-2 bg-muted/40 border border-border px-3 py-1.5 rounded-lg text-xs">
                      <span className="font-semibold text-foreground">{reason}</span>
                      <span className="h-5 px-1.5 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center">
                        {String(count)}x
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-border pb-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              All Activity ({combinedRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sales'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              Sales Returns ({salesList.length})
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'purchases'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              Purchase Returns ({purchaseList.length})
            </button>
          </div>

          {/* DataTable */}
          <DataTable
            title="Unified Returns Log"
            data={combinedRecords}
            columns={columns}
            searchKey="partyName"
            searchPlaceholder="Search by Customer, Supplier, RMA #..."
          />
        </div>

        {/* RMA DETAIL INSPECTION MODAL */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Return Record Details"
          size="lg"
        >
          {selectedRecord && (
            <div className="space-y-5 text-foreground">
              {/* Top Banner */}
              <div className="p-4 bg-muted/30 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black tracking-tight">{selectedRecord.returnNo}</h2>
                    <Badge variant={selectedRecord.activityType === 'Sales Return' ? 'info' : 'warning'}>
                      {selectedRecord.activityType}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Date: {selectedRecord.returnDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Total Value</p>
                  <p className="text-2xl font-black text-primary">₹{(Number(selectedRecord.totalAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-card p-4 rounded-xl border border-border text-xs">
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Party / Registered Name</p>
                  <p className="font-bold text-foreground text-sm">{selectedRecord.partyName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Reference Doc</p>
                  <p className="font-mono font-semibold text-foreground text-sm">{selectedRecord.refNo}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium mb-1">Status</p>
                  <Badge variant="success">{selectedRecord.status || 'Completed'}</Badge>
                </div>
              </div>

              {/* Reason */}
              <div className="p-3.5 bg-muted/20 border border-border rounded-xl">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Reason / Diagnosis</p>
                <p className="text-xs text-foreground/90 leading-relaxed">{selectedRecord.reason || 'Standard returns authorization.'}</p>
              </div>

              {/* Items List */}
              {Array.isArray(selectedRecord.items) && selectedRecord.items.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold text-left">
                      <tr>
                        <th className="p-3">Item / Description</th>
                        <th className="p-3 text-center">Qty Returned</th>
                        <th className="p-3 text-right">Unit Rate</th>
                        <th className="p-3 text-right">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedRecord.items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="p-3 font-semibold text-foreground">{item.name || item.productName || 'Returned Product Item'}</td>
                          <td className="p-3 text-center font-bold text-primary">{item.quantity}</td>
                          <td className="p-3 text-right">₹{(Number(item.price || item.unitPrice || 0)).toFixed(2)}</td>
                          <td className="p-3 text-right font-black text-foreground">₹{((Number(item.price || item.unitPrice || 0)) * (Number(item.quantity) || 1)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
                  <Printer className="h-4 w-4" /> Print Record
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

      </PageContainer>
    </AppShell>
  );
}
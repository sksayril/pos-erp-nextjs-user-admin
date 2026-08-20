'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { mockSales } from '../../lib/mockData';
import { useRouter } from 'next/navigation';
import { Plus, Printer } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export default function SalesListPage() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>(mockSales);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/sales')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSales(data);
        }
      })
      .catch((err) => console.error('Error fetching sales:', err));
  }, []);

  const columns = [
    { header: 'Invoice Number', accessor: 'invoiceNumber', sortable: true },
    { header: 'Customer', accessor: 'customerName', sortable: true },
    { header: 'Sale Date', accessor: 'date' },
    { 
      header: 'Grand Total', 
      accessor: 'grandTotal',
      render: (row: any) => <span className="font-extrabold text-foreground">Rs. {row.grandTotal.toFixed(2)}</span>
    },
    { 
      header: 'Paid', 
      accessor: 'paidAmount',
      render: (row: any) => <span>Rs. {row.paidAmount.toFixed(2)}</span>
    },
    { 
      header: 'Due', 
      accessor: 'dueAmount',
      render: (row: any) => <span className={row.dueAmount > 0 ? "text-orange-500 font-semibold" : "text-success"}>Rs. {row.dueAmount.toFixed(2)}</span>
    },
    { 
      header: 'Payment Status', 
      accessor: 'paymentStatus',
      render: (row: any) => <Badge variant={row.paymentStatus === 'Paid' ? 'success' : 'warning'}>{row.paymentStatus}</Badge>
    }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Sales History"
          data={sales}
          columns={columns}
          searchKey="invoiceNumber"
          searchPlaceholder="Search by invoice number..."
          headerActions={
            <Button variant="primary" onClick={() => router.push('/sales/create')} className="h-9 font-bold">
              <Plus className="h-4 w-4" /> Create Sale
            </Button>
          }
          onView={(row: any) => {
            setSelectedInvoice(row);
            setPreviewModalOpen(true);
          }}
          onEdit={(row: any) => router.push(`/sales/${row.id || row._id}/edit`)}
        />

        {/* DETAILED TAX INVOICE PDF PREVIEW MODAL */}
        <Modal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          title="Tax Invoice Detailed Receipt"
          size="lg"
        >
          {selectedInvoice && (
            <div className="space-y-6 select-none">
              
              {/* Printable PDF Area */}
              <div className="print-area border border-zinc-200 bg-white text-zinc-900 p-8 rounded-xl space-y-6 font-sans text-xs">
                {/* PDF Header */}
                <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-black tracking-wider uppercase text-zinc-900">POS ERP SUITE</h2>
                    <p className="text-[9px] text-zinc-500 font-bold">GSTIN: 19ABCDE1234F1Z5</p>
                    <p className="text-[9px] text-zinc-500">12 Main St, Tech City, Sector 5, Kolkata</p>
                    <p className="text-[9px] text-zinc-500">PH: (555) 0199-8877 | support@erp.com</p>
                  </div>
                  <div className="text-right space-y-1">
                    <h3 className="text-sm font-black text-primary tracking-wide uppercase">TAX INVOICE</h3>
                    <p className="font-mono font-bold text-zinc-800">INV: {selectedInvoice.invoiceNumber}</p>
                    <p className="text-[10px] text-zinc-500 font-bold">DATE: {selectedInvoice.date}</p>
                  </div>
                </div>

                {/* Billing Addresses Info */}
                <div className="grid grid-cols-2 gap-4 pb-2">
                  <div className="p-3 bg-zinc-50/50 border border-zinc-100 rounded-lg space-y-1">
                    <p className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-wider">Billed To (Customer):</p>
                    <p className="font-bold text-zinc-800 text-xs">{selectedInvoice.customerName}</p>
                    <p className="text-zinc-500">Walk-In Client Ledger Accounts</p>
                    <p className="text-zinc-500">Contact: Registered Phone Record</p>
                  </div>
                  <div className="p-3 bg-zinc-50/50 border border-zinc-100 rounded-lg space-y-1 text-right">
                    <p className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-wider">Dispatched From Location:</p>
                    <p className="font-bold text-zinc-800 text-xs">Main Warehouse Terminal</p>
                    <p className="text-zinc-500">Zone-01 central supply godown</p>
                    <p className="text-zinc-500">Location ID: wh-1</p>
                  </div>
                </div>

                {/* Items details table */}
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-200 font-bold text-zinc-700">
                        <th className="p-2.5">S.No</th>
                        <th className="p-2.5">Product Description</th>
                        <th className="p-2.5">SKU</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-center">Quantity</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-800">
                      {selectedInvoice.items && selectedInvoice.items.map((it: any, index: number) => (
                        <tr key={it.productId || index}>
                          <td className="p-2.5">{index + 1}</td>
                          <td className="p-2.5 font-bold">{it.productName}</td>
                          <td className="p-2.5">{it.sku}</td>
                          <td className="p-2.5 text-right">Rs. {it.price.toFixed(2)}</td>
                          <td className="p-2.5 text-center">{it.quantity}</td>
                          <td className="p-2.5 text-right font-bold">Rs. {((it.price * it.quantity)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculations & Summary Grid */}
                <div className="flex justify-between items-start pt-2">
                  <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg max-w-[50%] space-y-1 text-zinc-800">
                    <p className="text-[9px] font-extrabold text-zinc-500 uppercase">Payment Info:</p>
                    <p className="font-bold">Mode: {selectedInvoice.paymentMethod}</p>
                    <p className="text-zinc-500">Status: {selectedInvoice.paymentStatus}</p>
                    <p className="text-[8px] text-zinc-400 mt-1.5 leading-normal">
                      This is a computer generated invoice and does not require a physical signature.
                    </p>
                  </div>
                  
                  <div className="w-56 space-y-1.5 text-right">
                    <div className="flex justify-between text-zinc-500">
                      <span>Subtotal:</span>
                      <span className="font-bold text-zinc-800">Rs. {selectedInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Discount:</span>
                      <span className="font-bold text-rose-500">-Rs. {selectedInvoice.discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Tax Amount (GST):</span>
                      <span className="font-bold text-zinc-800">+Rs. {selectedInvoice.tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-dashed border-zinc-300 my-1" />
                    <div className="flex justify-between font-extrabold text-sm text-zinc-900">
                      <span>Grand Total:</span>
                      <span className="text-primary text-base">Rs. {selectedInvoice.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Signature placeholders */}
                <div className="flex justify-between pt-12 text-[10px]">
                  <div className="text-center w-36 border-t border-zinc-300 pt-1 text-zinc-500">
                    Customer Signature
                  </div>
                  <div className="text-center w-36 border-t border-zinc-300 pt-1 text-zinc-500 font-bold">
                    Authorized Signatory
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t border-border/60 pt-4">
                <Button variant="outline" onClick={() => setPreviewModalOpen(false)}>
                  Close Preview
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    window.print();
                  }}
                  className="font-bold gap-1.5"
                >
                  <Printer className="h-4 w-4" /> Print / Save PDF
                </Button>
              </div>
              
            </div>
          )}
        </Modal>
      </PageContainer>
    </AppShell>
  );
}
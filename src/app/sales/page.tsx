'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { mockSales } from '../../lib/mockData';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export default function SalesListPage() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>(mockSales);

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
      render: (row: any) => <span className="font-extrabold text-foreground">Rs. ${row.grandTotal.toFixed(2)}</span>
    },
    { 
      header: 'Paid', 
      accessor: 'paidAmount',
      render: (row: any) => <span>Rs. ${row.paidAmount.toFixed(2)}</span>
    },
    { 
      header: 'Due', 
      accessor: 'dueAmount',
      render: (row: any) => <span className={row.dueAmount > 0 ? "text-orange-500 font-semibold" : "text-success"}>Rs. ${row.dueAmount.toFixed(2)}</span>
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
          onView={(row: any) => router.push(`/sales/${row.id || row._id}`)}
          onEdit={(row: any) => router.push(`/sales/${row.id || row._id}/edit`)}
        />
      </PageContainer>
    </AppShell>
  );
}
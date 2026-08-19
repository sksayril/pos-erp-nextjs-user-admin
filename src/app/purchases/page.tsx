'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { mockPurchases } from '../../lib/mockData';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export default function PurchasesListPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<any[]>(mockPurchases);

  useEffect(() => {
    fetch('/api/purchases')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPurchases(data);
        }
      })
      .catch((err) => console.error('Error fetching purchases:', err));
  }, []);

  const columns = [
    { header: 'Purchase No', accessor: 'purchaseNumber', sortable: true },
    { header: 'Supplier Name', accessor: 'supplierName', sortable: true },
    { header: 'Order Date', accessor: 'date' },
    { 
      header: 'Total Cost', 
      accessor: 'grandTotal',
      render: (row: any) => <span className="font-bold text-foreground">Rs. ${row.grandTotal.toFixed(2)}</span>
    },
    { 
      header: 'Paid Amount', 
      accessor: 'paidAmount',
      render: (row: any) => <span>Rs. ${row.paidAmount.toFixed(2)}</span>
    },
    { 
      header: 'Due Amount', 
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
          title="Stock Purchases"
          data={purchases}
          columns={columns}
          searchKey="purchaseNumber"
          searchPlaceholder="Search by purchase number..."
          headerActions={
            <Button variant="primary" onClick={() => router.push('/purchases/create')} className="h-9 font-bold">
              <Plus className="h-4 w-4" /> Add Purchase
            </Button>
          }
          onView={(row: any) => router.push(`/purchases/${row.id || row._id}`)}
          onEdit={(row: any) => router.push(`/purchases/${row.id || row._id}/edit`)}
        />
      </PageContainer>
    </AppShell>
  );
}
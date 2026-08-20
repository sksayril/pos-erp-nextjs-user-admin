'use client';

import React, { useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable, ColumnConfig, FilterConfig } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { useToastStore } from '../../../lib/store';
import { mockUsers, mockWarehouses } from '../../../lib/mockData';
import { User } from '../../../lib/types';
import { Shield, Building2, CheckCircle2, XCircle, UserPlus, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const roleColors: Record<string, string> = {
  'Super Admin': 'bg-purple-100 text-purple-700 border-purple-200',
  'Admin': 'bg-blue-100 text-blue-700 border-blue-200',
  'Manager': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Cashier': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Accountant': 'bg-amber-100 text-amber-700 border-amber-200',
  'Purchase Manager': 'bg-orange-100 text-orange-700 border-orange-200',
  'Sales Manager': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'HR Manager': 'bg-rose-100 text-rose-700 border-rose-200',
  'Warehouse Manager': 'bg-teal-100 text-teal-700 border-teal-200',
  'Distributor': 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function PeopleUsersPage() {
  const [users] = useState<User[]>(mockUsers);

  const columns: ColumnConfig<User>[] = [
    {
      header: 'User',
      accessor: 'name',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
            {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-foreground text-sm">{u.name}</div>
            <div className="text-xs text-muted-foreground">{u.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (u) => <span className="font-mono text-xs text-muted-foreground">{u.phone || '—'}</span>
    },
    {
      header: 'Role',
      accessor: 'role',
      sortable: true,
      render: (u) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColors[u.role] || 'bg-muted text-muted-foreground border-border'}`}>
          <Shield className="h-3 w-3" />
          {u.role}
        </span>
      )
    },
    {
      header: 'Warehouse',
      accessor: 'warehouseId',
      render: (u) => {
        const wh = mockWarehouses.find(w => w.id === u.warehouseId);
        return (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            {wh?.name || '—'}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (u) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
          u.status === 'Active'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {u.status === 'Active' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {u.status}
        </span>
      )
    }
  ];

  const filters: FilterConfig[] = [
    {
      name: 'Role',
      key: 'role',
      options: ['Super Admin', 'Admin', 'Manager', 'Cashier', 'Accountant', 'Purchase Manager', 'Sales Manager', 'HR Manager', 'Warehouse Manager', 'Distributor']
    },
    { name: 'Status', key: 'status', options: ['Active', 'Inactive'] },
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          data={users}
          columns={columns}
          title="System Users"
          searchPlaceholder="Search users by name or email..."
          filters={filters}
          headerActions={
            <Link href="/settings/users">
              <Button variant="primary" size="sm">
                <UserPlus className="h-4 w-4" />
                Manage Users
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </Link>
          }
        />
      </PageContainer>
    </AppShell>
  );
}
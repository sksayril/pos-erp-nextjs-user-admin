'use client';

import React from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { mockEmployees } from '../../../lib/mockData';

export default function EmployeesPage() {
  const columns = [
    { header: 'Employee ID', accessor: 'employeeId', sortable: true },
    { header: 'Full Name', accessor: 'name', sortable: true },
    { header: 'Department', accessor: 'department', sortable: true },
    { header: 'Designation', accessor: 'designation' },
    { header: 'Monthly Salary', accessor: 'salary', render: (row: any) => <span>Rs. ${row.salary.toLocaleString()}</span> },
    { header: 'Status', accessor: 'status', render: (row: any) => <Badge variant={row.status === 'Active' ? 'success' : 'destructive'}>{row.status}</Badge> }
  ];

  return (
    <AppShell>
      <PageContainer>
        <DataTable
          title="Employee HRM Board"
          data={mockEmployees}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search employees by name..."
        />
      </PageContainer>
    </AppShell>
  );
}
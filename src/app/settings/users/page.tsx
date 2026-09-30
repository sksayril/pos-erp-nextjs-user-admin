'use client';

import React, { useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable, ColumnConfig, FilterConfig } from '../../../components/ui/DataTable';
import { Modal, ConfirmDialog } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { useToastStore, useUserRegistry, useAuthStore, UserWithPassword } from '../../../lib/store';
import { mockWarehouses } from '../../../lib/mockData';
import { User, UserRole } from '../../../lib/types';
import {
  UserPlus, Shield, Building2, Phone, Mail, Lock,
  Users, CheckCircle2, XCircle, Eye, EyeOff, Key
} from 'lucide-react';

const ALL_ROLES: UserRole[] = [
  'Super Admin', 'Admin', 'Manager', 'Cashier',
  'Accountant', 'Purchase Manager', 'Sales Manager',
  'HR Manager', 'Warehouse Manager', 'Distributor'
];

const roleColors: Record<string, string> = {
  'Super Admin': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
  'Admin': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  'Manager': 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300',
  'Cashier': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Accountant': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
  'Purchase Manager': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
  'Sales Manager': 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300',
  'HR Manager': 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300',
  'Warehouse Manager': 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300',
  'Distributor': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300',
};

const roleDescriptions: Record<string, string> = {
  'Super Admin': 'Master owner with full access to all system modules, activation, and user management.',
  'Admin': 'Administrator with permissions for sales, products, purchases, reports, and staff management.',
  'Manager': 'Store manager with access to POS, Sales, Purchases, Inventory, HRM, and Reports.',
  'Cashier': 'POS cashier with fast access to POS Terminal Billing, Sales Invoices & Receipts.',
  'Accountant': 'Accounting specialist with access to Cash/Bank books, Ledgers, Expenses & Financial Reports.',
  'HR Manager': 'Human resource manager with access to Employee database, Attendance, Payroll & Leave tracking.',
  'Purchase Manager': 'Handles purchase orders, suppliers, goods inward, and stock inventory.',
  'Sales Manager': 'Manages sales teams, customer quotations, pricing, and deliveries.',
  'Warehouse Manager': 'Oversees warehouses, stock adjustment, item transfers, and product batches.',
  'Distributor': 'Distributor user for wholesale ordering, delivery waybills, and quotations.'
};

const defaultForm = {
  name: '', email: '', phone: '',
  role: 'Cashier' as UserRole,
  status: 'Active' as 'Active' | 'Inactive',
  warehouseId: 'wh-1',
  password: '', confirmPassword: ''
};

export default function SettingsUsersPage() {
  const { addToast } = useToastStore();
  const { user: currentUser } = useAuthStore();
  const { registry, addRegistryUser, updateRegistryUser, deleteRegistryUser, loadUsersFromDB, isLoading } = useUserRegistry();

  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithPassword | null>(null);
  const [viewUser, setViewUser] = useState<UserWithPassword | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserWithPassword | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync with live MongoDB users database on mount
  React.useEffect(() => {
    loadUsersFromDB();
  }, [loadUsersFromDB]);

  const openAdd = () => {
    setEditingUser(null);
    setForm(defaultForm);
    setErrors({});
    setShowPwd(false);
    setModalOpen(true);
  };

  const openEdit = (user: UserWithPassword) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      warehouseId: user.warehouseId || 'wh-1',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
    setShowPwd(false);
    setModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Full name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format.';
    else {
      const duplicate = registry.find(u => u.email.toLowerCase() === form.email.toLowerCase() && u.id !== editingUser?.id);
      if (duplicate) errs.email = 'This email is already in use.';
    }
    if (!editingUser) {
      if (!form.password) errs.password = 'Password is required for new users.';
      else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    }
    if (form.password && form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (form.password && form.password.length > 0 && form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    if (editingUser) {
      const updates: Partial<UserWithPassword> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        status: form.status,
        warehouseId: form.warehouseId,
      };
      if (form.password) updates.password = form.password;
      updateRegistryUser(editingUser.id, updates);
      addToast('success', 'User Updated', `${form.name}'s profile has been updated.`);
    } else {
      const newUser: UserWithPassword = {
        id: `usr-${Date.now()}`,
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        status: form.status,
        warehouseId: form.warehouseId,
        password: form.password,
      };
      addRegistryUser(newUser);
      addToast('success', 'User Created', `${form.name} added. They can now login with their email & password.`);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.role === 'Super Admin') {
      addToast('error', 'Cannot Delete', 'Super Admin cannot be removed from the system.');
      setDeleteTarget(null);
      return;
    }
    if (deleteTarget.id === currentUser?.id) {
      addToast('error', 'Cannot Delete', 'You cannot delete your own account.');
      setDeleteTarget(null);
      return;
    }
    deleteRegistryUser(deleteTarget.id);
    addToast('success', 'User Deleted', `${deleteTarget.name} has been removed.`);
    setDeleteTarget(null);
  };

  const activeCount = registry.filter(u => u.status === 'Active').length;
  const inactiveCount = registry.filter(u => u.status === 'Inactive').length;

  const columns: ColumnConfig<UserWithPassword>[] = [
    {
      header: 'User',
      accessor: 'name',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
            {u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
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
      render: (u) => <span className="text-muted-foreground text-xs font-mono">{u.phone || '—'}</span>
    },
    {
      header: 'Role',
      accessor: 'role',
      sortable: true,
      render: (u) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColors[u.role] || 'bg-muted text-muted-foreground'}`}>
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
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400'
            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {u.status === 'Active' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {u.status}
        </span>
      )
    }
  ];

  const filters: FilterConfig[] = [
    { name: 'Role', key: 'role', options: ALL_ROLES },
    { name: 'Status', key: 'status', options: ['Active', 'Inactive'] },
  ];

  const F = (key: keyof typeof form, value: string) => setForm(p => ({ ...p, [key]: value }));

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">

          {/* Role restriction notice for non-super-admin */}
          {!isSuperAdmin && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-amber-800 dark:text-amber-300 text-sm">
              <Shield className="h-5 w-5 shrink-0" />
              <span><strong>View Only:</strong> Only Super Admin can create, edit, or delete users.</span>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: registry.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Active', value: activeCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'Inactive', value: inactiveCount, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
              { label: 'Roles In Use', value: [...new Set(registry.map(u => u.role))].length, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className="shadow-sm border-border/60">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div>
                    <div className={`text-xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table */}
          <DataTable
            data={registry}
            columns={columns}
            title="System Users"
            searchPlaceholder="Search by name or email..."
            filters={filters}
            onView={(u) => setViewUser(u)}
            onEdit={isSuperAdmin ? openEdit : undefined}
            onDelete={isSuperAdmin ? (u) => setDeleteTarget(u) : undefined}
            headerActions={
              isSuperAdmin ? (
                <Button variant="primary" size="sm" onClick={openAdd}>
                  <UserPlus className="h-4 w-4" />
                  Add User
                </Button>
              ) : undefined
            }
          />
        </div>

        {/* Add / Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingUser ? 'Edit User' : 'Create New User'}
          description={editingUser ? `Editing ${editingUser.name}` : 'Add a new system user with login credentials'}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave}>
                {editingUser ? 'Save Changes' : 'Create User'}
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Full Name *
                </label>
                <input
                  className={`h-9 w-full rounded-lg border px-3 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${errors.name ? 'border-destructive' : 'border-border'}`}
                  value={form.name}
                  onChange={(e) => F('name', e.target.value)}
                  placeholder="e.g. Aryan Sharma"
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email Address *
                </label>
                <input
                  type="email"
                  className={`h-9 w-full rounded-lg border px-3 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${errors.email ? 'border-destructive' : 'border-border'}`}
                  value={form.email}
                  onChange={(e) => F('email', e.target.value)}
                  placeholder="user@company.com"
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>

            {/* Phone & Warehouse */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Phone Number
                </label>
                <input
                  className="h-9 w-full rounded-lg border border-border px-3 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={form.phone}
                  onChange={(e) => F('phone', e.target.value)}
                  placeholder="e.g. 9900001111"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Warehouse
                </label>
                <select
                  className="h-9 w-full rounded-lg border border-border px-3 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={form.warehouseId}
                  onChange={(e) => F('warehouseId', e.target.value)}
                >
                  {mockWarehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Role *
                </label>
                <select
                  className="h-9 w-full rounded-lg border border-border px-3 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={form.role}
                  onChange={(e) => F('role', e.target.value as UserRole)}
                >
                  {ALL_ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground leading-tight pt-0.5">
                  ℹ️ {roleDescriptions[form.role]}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Account Status</label>
                <div className="flex gap-3 pt-1">
                  {(['Active', 'Inactive'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => F('status', s)}
                      className={`flex-1 h-9 rounded-lg text-sm font-semibold border transition-all ${
                        form.status === s
                          ? s === 'Active'
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-red-500 text-white border-red-500'
                          : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" />
                {editingUser ? 'Change Password (leave blank to keep current)' : 'Set Login Password *'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {editingUser ? 'New Password' : 'Password *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      className={`h-9 w-full rounded-lg border px-3 pr-9 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${errors.password ? 'border-destructive' : 'border-border'}`}
                      value={form.password}
                      onChange={(e) => F('password', e.target.value)}
                      placeholder="Min. 6 characters"
                    />
                    <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Confirm Password</label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className={`h-9 w-full rounded-lg border px-3 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${errors.confirmPassword ? 'border-destructive' : 'border-border'}`}
                    value={form.confirmPassword}
                    onChange={(e) => F('confirmPassword', e.target.value)}
                    placeholder="Repeat password"
                  />
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                The user will use this email + password to sign in to the ERP system.
              </p>
            </div>
          </div>
        </Modal>

        {/* View Details Modal */}
        {viewUser && (
          <Modal
            isOpen={!!viewUser}
            onClose={() => setViewUser(null)}
            title="User Details"
            size="sm"
            footer={
              <>
                <Button variant="outline" onClick={() => setViewUser(null)}>Close</Button>
                {isSuperAdmin && (
                  <Button variant="primary" onClick={() => { openEdit(viewUser); setViewUser(null); }}>Edit User</Button>
                )}
              </>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/70 to-primary flex items-center justify-center text-white font-bold text-2xl shadow-md">
                  {viewUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <div className="font-bold text-lg text-foreground">{viewUser.name}</div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColors[viewUser.role] || ''}`}>
                    <Shield className="h-3 w-3" /> {viewUser.role}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {[
                  { label: 'Email', value: viewUser.email, icon: Mail },
                  { label: 'Phone', value: viewUser.phone || '—', icon: Phone },
                  { label: 'Warehouse', value: mockWarehouses.find(w => w.id === viewUser.warehouseId)?.name || '—', icon: Building2 },
                  { label: 'Status', value: viewUser.status, icon: viewUser.status === 'Active' ? CheckCircle2 : XCircle },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="font-medium text-foreground">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
              {isSuperAdmin && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary">
                  <Lock className="h-3.5 w-3.5" />
                  Password is stored securely. Use Edit to change it.
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Delete Confirm */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete User"
          description={`Delete "${deleteTarget?.name}"? They will no longer be able to log in.`}
          confirmText="Delete User"
          variant="destructive"
        />
      </PageContainer>
    </AppShell>
  );
}
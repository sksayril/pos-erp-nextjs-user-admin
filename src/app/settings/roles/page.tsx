'use client';

import React, { useState } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Modal, ConfirmDialog } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useToastStore } from '../../../lib/store';
import { mockUsers } from '../../../lib/mockData';
import { UserRole } from '../../../lib/types';
import {
  Shield, Plus, Edit3, Trash2, Users, CheckCircle2,
  Crown, Lock, ChevronDown, ChevronUp, Info
} from 'lucide-react';

interface RoleDef {
  id: string;
  name: UserRole;
  description: string;
  color: string;
  isSystem: boolean;
  memberCount: number;
}

const roleColors: Record<string, string> = {
  'Super Admin': 'from-purple-500 to-violet-600',
  'Admin': 'from-blue-500 to-blue-700',
  'Manager': 'from-indigo-500 to-indigo-700',
  'Cashier': 'from-emerald-500 to-green-600',
  'Accountant': 'from-amber-500 to-yellow-600',
  'Purchase Manager': 'from-orange-500 to-orange-700',
  'Sales Manager': 'from-cyan-500 to-sky-600',
  'HR Manager': 'from-rose-500 to-pink-600',
  'Warehouse Manager': 'from-teal-500 to-teal-700',
  'Distributor': 'from-slate-500 to-slate-700',
};

const buildRoles = (users: typeof mockUsers): RoleDef[] => {
  const allRoles: UserRole[] = [
    'Super Admin', 'Admin', 'Manager', 'Cashier',
    'Accountant', 'Purchase Manager', 'Sales Manager',
    'HR Manager', 'Warehouse Manager', 'Distributor'
  ];
  const descriptions: Record<string, string> = {
    'Super Admin': 'Full unrestricted access to all modules and system settings.',
    'Admin': 'Administrative access to all business operations except certain system-level settings.',
    'Manager': 'Manages daily operations including sales, purchases, and team oversight.',
    'Cashier': 'Access to POS terminal and basic sales functions only.',
    'Accountant': 'Full access to accounting, expenses, and financial reports.',
    'Purchase Manager': 'Manages all procurement, suppliers, and purchase orders.',
    'Sales Manager': 'Oversees sales team, sales reports, and customer management.',
    'HR Manager': 'Manages employee records, attendance, payroll, and leaves.',
    'Warehouse Manager': 'Manages stock, transfers, and warehouse operations.',
    'Distributor': 'External distributor with limited view access to assigned items.',
  };
  return allRoles.map((name, idx) => ({
    id: `role-${idx + 1}`,
    name,
    description: descriptions[name] || 'Custom role with configurable permissions.',
    color: roleColors[name] || 'from-slate-500 to-slate-700',
    isSystem: ['Super Admin', 'Admin'].includes(name),
    memberCount: users.filter(u => u.role === name).length,
  }));
};

const defaultForm = { name: '', description: '' };

export default function RolesPage() {
  const { addToast } = useToastStore();
  const [roles, setRoles] = useState<RoleDef[]>(() => buildRoles(mockUsers));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDef | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleDef | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openAdd = () => {
    setEditingRole(null);
    setForm(defaultForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (role: RoleDef) => {
    if (role.isSystem) {
      addToast('info', 'System Role', 'System roles cannot be renamed. You can update their permissions in the Permissions Matrix.');
      return;
    }
    setEditingRole(role);
    setForm({ name: role.name, description: role.description });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Role name is required.';
    else if (roles.some(r => r.name.toLowerCase() === form.name.toLowerCase() && r.id !== editingRole?.id)) {
      errs.name = 'A role with this name already exists.';
    }
    if (!form.description.trim()) errs.description = 'Description is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editingRole) {
      setRoles(prev => prev.map(r => r.id === editingRole.id
        ? { ...r, name: form.name as UserRole, description: form.description }
        : r
      ));
      addToast('success', 'Role Updated', `"${form.name}" role updated successfully.`);
    } else {
      const newRole: RoleDef = {
        id: `role-custom-${Date.now()}`,
        name: form.name as UserRole,
        description: form.description,
        color: 'from-primary/70 to-primary',
        isSystem: false,
        memberCount: 0,
      };
      setRoles(prev => [...prev, newRole]);
      addToast('success', 'Role Created', `"${form.name}" role has been created.`);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.memberCount > 0) {
      addToast('error', 'Cannot Delete', `This role has ${deleteTarget.memberCount} active user(s). Reassign them first.`);
      setDeleteTarget(null);
      return;
    }
    setRoles(prev => prev.filter(r => r.id !== deleteTarget.id));
    addToast('success', 'Role Deleted', `"${deleteTarget.name}" role removed.`);
    setDeleteTarget(null);
  };

  const totalUsers = mockUsers.length;

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Roles &amp; Groups</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Define and manage user roles and their access groups</p>
            </div>
            <Button variant="primary" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              New Role
            </Button>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Roles', value: roles.length, icon: Shield, color: 'text-primary' },
              { label: 'System Roles', value: roles.filter(r => r.isSystem).length, icon: Crown, color: 'text-amber-500' },
              { label: 'Custom Roles', value: roles.filter(r => !r.isSystem).length, icon: Lock, color: 'text-indigo-500' },
              { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-emerald-500' },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="shadow-sm">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <Icon className={`h-8 w-8 ${color}`} />
                  <div>
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => {
              const isExpanded = expandedRole === role.id;
              const membersOfRole = mockUsers.filter(u => u.role === role.name);
              return (
                <Card key={role.id} className={`shadow-sm border-border/60 transition-all duration-200 ${isExpanded ? 'ring-1 ring-primary/30' : ''}`}>
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-sm`}>
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{role.name}</span>
                            {role.isSystem && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/50">
                                <Crown className="h-2.5 w-2.5" /> System
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {role.memberCount} user{role.memberCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Toggle Members"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        {!role.isSystem && (
                          <>
                            <button
                              onClick={() => openEdit(role)}
                              className="rounded-lg p-1.5 text-primary hover:bg-primary/10 transition-colors"
                              title="Edit Role"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(role)}
                              className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                              title="Delete Role"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{role.description}</p>

                    {/* Expanded Members */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border/50 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Members ({membersOfRole.length})
                        </div>
                        {membersOfRole.length > 0 ? membersOfRole.map(u => (
                          <div key={u.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/30 border border-border/30">
                            <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                              {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-foreground truncate">{u.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                            </div>
                            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              u.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400'
                                : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              <CheckCircle2 className="h-2.5 w-2.5" /> {u.status}
                            </span>
                          </div>
                        )) : (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                            <Info className="h-4 w-4" />
                            No users assigned to this role yet.
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Add / Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingRole ? 'Edit Role' : 'Create New Role'}
          description={editingRole ? 'Update role name and description' : 'Define a new custom user role for your system'}
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave}>
                {editingRole ? 'Save Changes' : 'Create Role'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Role Name *</label>
              <input
                className={`h-9 w-full rounded-lg border px-3 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${errors.name ? 'border-destructive' : 'border-border'}`}
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Inventory Clerk"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Description *</label>
              <textarea
                rows={3}
                className={`w-full rounded-lg border px-3 py-2 text-sm bg-card text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 ${errors.description ? 'border-destructive' : 'border-border'}`}
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe what this role can do..."
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-xs text-blue-700 dark:text-blue-300">
              <strong>Tip:</strong> After creating a role, go to the <strong>Permissions Matrix</strong> to configure which modules this role can access.
            </div>
          </div>
        </Modal>

        {/* Delete Confirm */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Role"
          description={`Delete role "${deleteTarget?.name}"? Users with this role will need to be reassigned.`}
          confirmText="Delete Role"
          variant="destructive"
        />
      </PageContainer>
    </AppShell>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { 
  FileText, 
  Plus, 
  Trash2, 
  RefreshCw, 
  X, 
  Save, 
  Calendar, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Building2,
  PackageCheck
} from 'lucide-react';
import { useToastStore } from '../../../lib/store';

export default function PurchaseOrdersPage() {
  const { addToast } = useToastStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    orderNumber: '',
    date: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    supplierName: 'Apple Authorized Distributor',
    warehouseName: 'Main Warehouse',
    productName: '',
    sku: '',
    quantity: 10,
    unitCost: 0,
    status: 'Draft',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, prodRes] = await Promise.all([
        fetch('/api/purchases/orders'),
        fetch('/api/products')
      ]);
      const orderData = await orderRes.json();
      const prodData = await prodRes.json();

      if (Array.isArray(orderData)) setOrders(orderData);
      if (Array.isArray(prodData)) setProducts(prodData);
    } catch (err) {
      console.error('Fetch PO error:', err);
      addToast('error', 'Error', 'Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    const p = products[0] || {};
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setFormData({
      orderNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: today,
      expectedDeliveryDate: nextWeek,
      supplierName: 'Apple Authorized Distributor',
      warehouseName: 'Main Central Hub',
      productName: p.name || 'Sample Item',
      sku: p.sku || 'SKU-001',
      quantity: 10,
      unitCost: Number(p.costPrice) || 1000,
      status: 'Draft',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleProductSelect = (id: string) => {
    const p = products.find((x: any) => (x._id || x.id) === id);
    if (p) {
      setFormData(prev => ({
        ...prev,
        productName: p.name,
        sku: p.sku,
        unitCost: Number(p.costPrice) || 0
      }));
    }
  };

  const handleStatusChange = async (po: any, newStatus: string) => {
    try {
      const res = await fetch('/api/purchases/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: po._id,
          status: newStatus
        })
      });

      if (!res.ok) throw new Error('Failed to update status');

      addToast('success', 'Status Updated', `Order ${po.orderNumber} marked as ${newStatus}!`);
      if (newStatus === 'Received') {
        addToast('info', 'Stock Synchronized', 'Physical items automatically received and added to active inventory.');
      }
      setStatusModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not update status');
    }
  };

  const handleDelete = async (id: string, poNum: string) => {
    if (!confirm(`Are you sure you want to delete PO "${poNum}"?`)) return;
    try {
      const res = await fetch(`/api/purchases/orders?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Deleted', `Purchase order "${poNum}" removed.`);
        fetchData();
      } else {
        throw new Error('Failed to delete PO');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not delete purchase order');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderNumber || !formData.supplierName) {
      addToast('warning', 'Validation', 'Order Number and Supplier are required');
      return;
    }

    try {
      const subtotal = Number(formData.unitCost) * Number(formData.quantity);
      const tax = (subtotal * 18) / 100;
      const totalAmount = subtotal + tax;

      const payload = {
        orderNumber: formData.orderNumber,
        date: formData.date,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        supplierName: formData.supplierName,
        warehouseName: formData.warehouseName,
        items: [
          {
            productName: formData.productName,
            sku: formData.sku,
            quantity: Number(formData.quantity) || 1,
            unitCost: Number(formData.unitCost) || 0,
            tax,
            total: totalAmount
          }
        ],
        subtotal,
        tax,
        totalAmount,
        status: formData.status,
        notes: formData.notes
      };

      const res = await fetch('/api/purchases/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save PO');

      addToast('success', 'Order Created', `Purchase order ${formData.orderNumber} successfully generated!`);
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not save purchase order');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Received':
        return <Badge variant="success" className="text-xs">Received (In Stock)</Badge>;
      case 'Shipped':
        return <Badge variant="warning" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">In Transit (Shipped)</Badge>;
      case 'Confirmed':
        return <Badge variant="warning" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/30">Confirmed</Badge>;
      case 'Cancelled':
        return <Badge variant="destructive" className="text-xs">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Draft PO</Badge>;
    }
  };

  const columns = [
    { 
      header: 'PO Reference', 
      accessor: 'orderNumber', 
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="font-mono font-bold text-xs text-foreground">{row.orderNumber}</p>
            <p className="text-[11px] text-muted-foreground font-mono">Date: {row.date}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Supplier & Destination', 
      accessor: 'supplierName', 
      sortable: true,
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground">{row.supplierName}</span>
          <span className="text-[11px] text-muted-foreground">{row.warehouseName || 'Main Central Hub'}</span>
        </div>
      )
    },
    { 
      header: 'Expected Delivery', 
      accessor: 'expectedDeliveryDate', 
      render: (row: any) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>{row.expectedDeliveryDate || 'Not specified'}</span>
        </div>
      )
    },
    { 
      header: 'Total Valuation', 
      accessor: 'totalAmount', 
      sortable: true,
      render: (row: any) => (
        <span className="font-mono font-bold text-xs text-foreground">
          Rs. {(Number(row.totalAmount) || 0).toLocaleString()}
        </span>
      )
    },
    { 
      header: 'Order Workflow Status', 
      accessor: 'status', 
      render: (row: any) => getStatusBadge(row.status)
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => { setSelectedPO(row); setStatusModalOpen(true); }} 
            className="h-8 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 flex items-center gap-1.5 text-xs font-semibold transition-all shadow-sm cursor-pointer"
            title="Update Workflow Status"
          >
            <PackageCheck className="h-4 w-4" /> Change Status
          </button>
          <button 
            onClick={() => handleDelete(row._id, row.orderNumber)} 
            className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title="Delete Order"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      )
    }
  ];

  const totalOrders = orders.length;
  const draftOrders = orders.filter(o => o.status === 'Draft').length;
  const inTransitOrders = orders.filter(o => o.status === 'Shipped' || o.status === 'Confirmed').length;
  const receivedOrders = orders.filter(o => o.status === 'Received').length;

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" /> Purchase Orders (PO)
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Authorise replenishment orders, manage vendor lead times, and track delivery status.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} className="h-9 gap-1.5">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button variant="primary" size="sm" onClick={openAddModal} className="h-9 gap-1.5 font-semibold">
                <Plus className="h-4 w-4" /> Create Purchase Order
              </Button>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total POs</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{totalOrders} Orders</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pending Review</p>
                <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{draftOrders} Drafts</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">In Transit</p>
                <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{inTransitOrders} Shipped</h3>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Received / Fulfilled</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{receivedOrders} Completed</h3>
              </div>
            </div>
          </div>

          {/* Table */}
          <DataTable
            title="Purchase Order Registry"
            data={orders}
            columns={columns}
            searchKey="orderNumber"
            searchPlaceholder="Search by PO number or supplier..."
          />

        </div>

        {/* Create PO Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Create Purchase Order
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">PO Number *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.orderNumber}
                      onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value.toUpperCase() })}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Order Date</label>
                    <input 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Supplier / Vendor *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.supplierName}
                      onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Expected Delivery</label>
                    <input 
                      type="date" 
                      value={formData.expectedDeliveryDate}
                      onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border px-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Select Product Item *</label>
                  <select 
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {products.map((p, i) => (
                      <option key={i} value={p._id || p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Order Quantity</label>
                    <input 
                      type="number" 
                      min={1}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Agreed Unit Cost (Rs.)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={formData.unitCost}
                      onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                      className="h-9 w-full rounded-lg border border-border px-3 bg-background font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Workflow Initial Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border px-2.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Draft">Draft PO (Internal)</option>
                    <option value="Confirmed">Confirmed with Supplier</option>
                    <option value="Shipped">Dispatched / In Transit</option>
                    <option value="Received">Received (Add to Stock)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="font-semibold gap-1.5">
                    <Save className="h-4 w-4" /> Generate Purchase Order
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Status Modal */}
        {statusModalOpen && selectedPO && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-base text-foreground">Update PO Status: {selectedPO.orderNumber}</h3>
                <button onClick={() => setStatusModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 text-xs">
                <p className="text-muted-foreground">
                  Change the procurement fulfillment stage for <strong>{selectedPO.orderNumber}</strong> ({selectedPO.supplierName}).
                </p>

                <div className="space-y-2">
                  <button 
                    type="button" 
                    onClick={() => handleStatusChange(selectedPO, 'Confirmed')}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-purple-500/50 hover:bg-purple-500/10 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-foreground">Mark as Confirmed</p>
                      <p className="text-[11px] text-muted-foreground">Supplier confirmed terms & shipment timeline</p>
                    </div>
                    <Badge variant="outline">Confirmed</Badge>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => handleStatusChange(selectedPO, 'Shipped')}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-blue-500/50 hover:bg-blue-500/10 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-foreground">Mark as Shipped / In Transit</p>
                      <p className="text-[11px] text-muted-foreground">Vendor dispatched consignment via logistics</p>
                    </div>
                    <Badge variant="outline">Shipped</Badge>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => handleStatusChange(selectedPO, 'Received')}
                    className="w-full text-left p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">Mark as Received (In Stock)</p>
                      <p className="text-[11px] text-muted-foreground">Items checked into warehouse & stock increased</p>
                    </div>
                    <Badge variant="success">Received</Badge>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => handleStatusChange(selectedPO, 'Cancelled')}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-rose-500/50 hover:bg-rose-500/10 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-rose-500">Cancel Purchase Order</p>
                      <p className="text-[11px] text-muted-foreground">Void order and cancel supplier contract</p>
                    </div>
                    <Badge variant="destructive">Cancelled</Badge>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </PageContainer>
    </AppShell>
  );
}
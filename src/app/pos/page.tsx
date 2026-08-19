'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePOSStore, useToastStore, useAuthStore } from '../../lib/store';
import { mockProducts, mockCustomers, mockWarehouses } from '../../lib/mockData';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { 
  ArrowLeft, Search, Barcode, Trash2, Plus, 
  Minus, ShoppingCart, HelpCircle, Save, FolderOpen, 
  DollarSign, CreditCard, QrCode, Split, CheckCircle 
} from 'lucide-react';

export default function POSPage() {
  const { 
    cart, selectedCustomer, discountRate, taxRate, heldBills, recentSales,
    addToCart, removeFromCart, updateCartQuantity, clearCart, 
    getTotals, setCustomer, setDiscount, setTax, holdBill, resumeBill, deleteHeldBill, checkout 
  } = usePOSStore();
  
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [productsList, setProductsList] = useState<any[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Checkout Dialog States
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Split' | 'Credit'>('Cash');
  const [amountPaid, setAmountPaid] = useState('0');
  const [changeAmount, setChangeAmount] = useState(0);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);

  // Held Bills Dialog
  const [heldBillsOpen, setHeldBillsOpen] = useState(false);

  // Load products from DB
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProductsList(data);
        }
      })
      .catch((err) => console.error('Error fetching live products:', err));
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        handleOpenCheckout();
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleHoldBill();
      } else if (e.key === 'F8') {
        e.preventDefault();
        document.getElementById('pos-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Categories list
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'cat-1', name: 'Electronics' },
    { id: 'cat-2', name: 'Beverages' },
    { id: 'cat-3', name: 'Office Supplies' },
    { id: 'cat-4', name: 'Snacks' }
  ];

  // Filtered Products
  const filteredProducts = productsList.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.barcode.includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory && product.status === 'Active';
  });

  // Barcode Input Scanner Simulation
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;
    const found = productsList.find((p) => p.barcode === barcodeInput || p.sku.toLowerCase() === barcodeInput.toLowerCase());
    if (found) {
      addToCart(found);
      addToast('success', 'Scanned Item', `${found.name} added to cart.`);
      setBarcodeInput('');
    } else {
      addToast('error', 'Barcode Not Found', `No product matches barcode or SKU "${barcodeInput}"`);
    }
  };

  const totals = getTotals();

  // Dialog helpers
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      addToast('warning', 'Cart Empty', 'Please add items to cart before checking out.');
      return;
    }
    setAmountPaid(totals.grandTotal.toFixed(2));
    setChangeAmount(0);
    setPaymentMethod('Cash');
    setCheckoutResult(null);
    setCheckoutModalOpen(true);
  };

  const handleAmountPaidChange = (val: string) => {
    setAmountPaid(val);
    const paid = parseFloat(val) || 0;
    setChangeAmount(Math.max(0, paid - totals.grandTotal));
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const paid = parseFloat(amountPaid) || 0;
    const dueAmount = Math.max(0, totals.grandTotal - paid);
    const paymentStatus = dueAmount === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Due';

    const salePayload = {
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      warehouseId: 'wh-1',
      items: cart,
      subtotal: totals.subtotal,
      discount: totals.discountAmount,
      tax: totals.taxAmount,
      grandTotal: totals.grandTotal,
      paidAmount: paid,
      dueAmount,
      paymentStatus,
      status: 'Completed',
      paymentMethod
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salePayload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit sale');
      }

      const savedSale = await res.json();
      checkout(paymentMethod, paid); // clear cart and update state
      setCheckoutResult(savedSale);
      addToast('success', 'Checkout Complete', `Sale stored in MongoDB.`);
    } catch (error: any) {
      console.error('Checkout Error:', error);
      addToast('error', 'Checkout Failed', error.message || 'Error processing transaction.');
    }
  };

  const handleHoldBill = () => {
    const id = holdBill();
    if (id) {
      addToast('success', 'Bill Held', 'Current sale has been put on hold.');
    } else {
      addToast('warning', 'Cart Empty', 'Add items to hold the bill.');
    }
  };

  const handleResumeBill = (id: string) => {
    resumeBill(id);
    setHeldBillsOpen(false);
    addToast('info', 'Bill Resumed', 'sale contents restored.');
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-100 dark:bg-zinc-950 overflow-hidden text-sm">
      
      {/* POS Top Toolbar */}
      <div className="flex h-16 items-center justify-between bg-card border-b border-border px-6 select-none shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-zinc-500 hover:text-foreground font-bold transition-colors">
            <ArrowLeft className="h-4.5 w-4.5" />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-3 py-1">
              Active Terminal 01
            </Badge>
            <span className="text-xs text-muted-foreground">Cashier: <strong className="text-foreground">{user?.name || 'Staff'}</strong></span>
          </div>
        </div>

        {/* Short-keys reference header */}
        <div className="hidden lg:flex items-center gap-6 text-xs text-muted-foreground">
          <span><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-bold text-foreground">F8</kbd> Search</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-bold text-foreground">F4</kbd> Hold</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-bold text-foreground">F2</kbd> Checkout</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Held Bills toggle */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setHeldBillsOpen(true)}
            className="relative font-semibold flex items-center gap-1.5 h-9 rounded-lg border-zinc-200"
          >
            <FolderOpen className="h-4 w-4 text-zinc-500" />
            Held Bills
            {heldBills.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 rounded-full bg-orange-600 text-[10px] font-extrabold text-white flex items-center justify-center">
                {heldBills.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* POS Content Grid */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        
        {/* Left Side: Product Discovery */}
        <div className="flex flex-col flex-1 min-w-0 p-4 space-y-4">
          
          {/* Filters and Scanner simulation row */}
          <div className="grid gap-3 grid-cols-1 md:grid-cols-3 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="pos-search"
                type="text"
                placeholder="Search Product Name/SKU (F8)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>
            
            {/* Barcode scanner simulator */}
            <form onSubmit={handleBarcodeSubmit} className="relative">
              <Barcode className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Scan Barcode / Enter SKU..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
              <button type="submit" className="hidden" />
            </form>

            {/* Warehouse display */}
            <div className="h-10 rounded-lg border border-border bg-muted/20 px-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Location:</span>
              <span className="font-bold text-foreground">Main Warehouse</span>
            </div>
          </div>

          {/* Category Quick Selector tab list */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 select-none scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`h-9 px-4 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card text-muted-foreground hover:bg-muted border border-border/80'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            {filteredProducts.length > 0 ? (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredProducts.map((product) => {
                  const hasLowStock = product.openingStock <= product.minStock;
                  return (
                    <div
                      key={product.id || product._id}
                      onClick={() => addToCart(product)}
                      className="group flex flex-col justify-between p-3.5 bg-card border border-border hover:border-primary/45 rounded-xl cursor-pointer transition-all hover:shadow-xs active:scale-[0.98]"
                    >
                      <div className="space-y-1">
                        {product.image && (
                          <div className="h-20 w-full rounded-lg overflow-hidden border border-border/60 bg-muted mb-2 shadow-inner">
                            <img src={product.image} alt={product.name} className="h-full w-full object-cover animate-in fade-in" />
                          </div>
                        )}
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] text-zinc-400 font-bold tracking-tight truncate">{product.sku}</span>
                          <Badge variant={hasLowStock ? 'destructive' : 'success'} className="px-1.5 py-0 text-[8px]">
                            {product.openingStock} {hasLowStock ? 'Low' : 'OK'}
                          </Badge>
                        </div>
                        <h4 className="text-xs font-bold text-foreground leading-tight line-clamp-2 mt-1">{product.name}</h4>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
                        <span className="text-xs font-black text-foreground">Rs. {product.sellingPrice.toFixed(2)}</span>
                        <div className="h-7 w-7 rounded-lg bg-primary/5 group-hover:bg-primary text-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                          <Plus className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground text-xs bg-card border border-border/60 rounded-xl p-8">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/50" />
                <span className="font-semibold text-foreground/80">No products matching filters</span>
                <span>Reset categories or search phrase.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart Summary Checkout panel */}
        <div className="w-96 bg-card border-l border-border flex flex-col h-full shrink-0">
          
          {/* Customer selector header */}
          <div className="p-4 border-b border-border/80 space-y-3 shrink-0 select-none">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Select Customer</label>
              <select
                value={selectedCustomer.id}
                onChange={(e) => {
                  const found = mockCustomers.find(c => c.id === e.target.value);
                  if (found) setCustomer(found);
                }}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                {mockCustomers.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name} ({cust.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cart items list viewport */}
          <div className="flex-1 overflow-y-auto min-h-0 px-4 py-2 space-y-2">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-2 p-3 bg-muted/20 border border-border rounded-xl">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-foreground truncate leading-tight">{item.productName}</h5>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Rs. {item.price.toFixed(2)} each</p>
                  </div>
                  
                  {/* Quantity adjustment panel */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                      className="h-7 w-7 rounded bg-card border border-border text-foreground hover:bg-muted flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-extrabold w-6 text-center text-foreground">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                      className="h-7 w-7 rounded bg-card border border-border text-foreground hover:bg-muted flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="h-8 w-8 rounded text-rose-500 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground text-xs leading-relaxed text-center p-4">
                <ShoppingCart className="h-8 w-8 text-muted-foreground/30 animate-bounce" />
                <span>Your checkout cart is empty</span>
                <span>Select products on the left to start billing.</span>
              </div>
            )}
          </div>

          {/* Checkout Calculations totals panel */}
          <div className="p-4 border-t border-border/80 bg-muted/10 space-y-3 shrink-0 select-none">
            
            {/* Discount and Tax Input Row */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountRate || ''}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="h-8 w-full rounded border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Tax (%)</label>
                <input
                  type="number"
                  min="0"
                  value={taxRate || ''}
                  onChange={(e) => setTax(Number(e.target.value))}
                  className="h-8 w-full rounded border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-border/50 my-2" />

            {/* Calculations lines */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>Rs. {totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Discount ({discountRate}%)</span>
                <span className="text-rose-500">-Rs. {totals.discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Tax ({taxRate}%)</span>
                <span>+Rs. {totals.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-extrabold text-foreground pt-1.5 border-t border-dashed border-border/60">
                <span>Grand Total</span>
                <span className="text-primary text-base">Rs. {totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* POS Core checkout button layout */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={clearCart}
                disabled={cart.length === 0}
                className="h-10 font-bold border-zinc-200"
              >
                Clear Cart
              </Button>
              <Button 
                variant="outline" 
                onClick={handleHoldBill}
                disabled={cart.length === 0}
                className="h-10 font-bold border-zinc-200"
              >
                Hold (F4)
              </Button>
            </div>
            
            <Button
              variant="primary"
              onClick={handleOpenCheckout}
              disabled={cart.length === 0}
              className="w-full h-12 mt-2 font-black shadow-md"
            >
              Pay Now (F2)
            </Button>
          </div>
          
        </div>
        
      </div>

      {/* 1. CHECKOUT MODAL DIALOG PANEL */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="POS Payment Wizard"
        size="lg"
      >
        {!checkoutResult ? (
          <form onSubmit={handleCheckoutSubmit} className="space-y-6">
            
            {/* Visual payment summary card */}
            <div className="p-4 bg-muted/20 border border-border rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Total Bill Due</p>
                <h3 className="text-2xl font-black text-primary mt-1">Rs. {totals.grandTotal.toFixed(2)}</h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase font-bold">Customer</p>
                <p className="text-sm font-bold text-foreground mt-1">{selectedCustomer.name}</p>
              </div>
            </div>

            {/* Payment Method Selector Grid */}
            <div className="space-y-2 select-none">
              <label className="text-xs font-bold text-muted-foreground">Select Payment Mode</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { mode: 'Cash', label: 'Cash', icon: <DollarSign className="h-4 w-4" /> },
                  { mode: 'Card', label: 'Card', icon: <CreditCard className="h-4 w-4" /> },
                  { mode: 'UPI', label: 'UPI / QR', icon: <QrCode className="h-4 w-4" /> },
                  { mode: 'Split', label: 'Split Pay', icon: <Split className="h-4 w-4" /> },
                  { mode: 'Credit', label: 'On Credit', icon: <HelpCircle className="h-4 w-4" /> }
                ].map((m) => (
                  <button
                    key={m.mode}
                    type="button"
                    onClick={() => setPaymentMethod(m.mode as any)}
                    className={`h-16 flex flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === m.mode
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-zinc-300 dark:hover:border-zinc-700 bg-card hover:bg-muted'
                    }`}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount input row */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Cash Received / Paid (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountPaid}
                  onChange={(e) => handleAmountPaidChange(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-card px-4 text-base font-extrabold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Cash Change Return (Rs.)</label>
                <div className="h-11 rounded-lg border border-border bg-muted/20 px-4 flex items-center font-extrabold text-base text-success select-none">
                  Rs. {changeAmount.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 flex justify-end gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={() => setCheckoutModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="h-11 px-6 font-bold shadow-md">
                Complete Checkout & Save
              </Button>
            </div>

          </form>
        ) : (
          /* Receipt panel layout */
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center text-center p-6 border border-emerald-100 bg-emerald-50/20 dark:bg-emerald-950/10 rounded-xl space-y-2 select-none">
              <CheckCircle className="h-10 w-10 text-success" />
              <h4 className="font-bold text-base text-foreground">Checkout Transaction Complete</h4>
              <p className="text-xs text-muted-foreground">Invoice Reference: <strong className="text-foreground">{checkoutResult.invoiceNumber}</strong></p>
            </div>

            {/* Printout Simulation visual Receipt */}
            <div id="receipt-print-area" className="border border-border/80 bg-white text-zinc-950 p-6 rounded-lg font-mono text-xs max-w-sm mx-auto space-y-4">
              <div className="text-center space-y-1 select-none">
                <h3 className="font-extrabold text-sm uppercase">POS ERP SYSTEM</h3>
                <p className="text-[10px]">12 Main St, Tech City</p>
                <p className="text-[10px]">PH: (555) 0199-8877</p>
              </div>
              
              <div className="border-t border-dashed border-zinc-300 my-2" />

              <div className="space-y-1 text-[10px] select-none">
                <p>INVOICE: {checkoutResult.invoiceNumber}</p>
                <p>DATE: {checkoutResult.date}</p>
                <p>CUSTOMER: {selectedCustomer.name}</p>
                <p>CASHIER: {user?.name || 'Staff'}</p>
              </div>

              <div className="border-t border-dashed border-zinc-300 my-2" />

              <table className="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 font-bold select-none">
                    <th className="pb-1">Item</th>
                    <th className="pb-1 text-center">Qty</th>
                    <th className="pb-1 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {checkoutResult.items.map((it: any) => (
                    <tr key={it.id}>
                      <td className="py-1 truncate max-w-[120px]">{it.productName}</td>
                      <td className="py-1 text-center">{it.quantity}</td>
                      <td className="py-1 text-right">Rs. {(it.price * it.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-zinc-300 my-2" />

              <div className="space-y-1 font-bold text-[10px] text-right">
                <p>Subtotal: Rs. {checkoutResult.subtotal.toFixed(2)}</p>
                <p>Discount: -Rs. {checkoutResult.discount.toFixed(2)}</p>
                <p>Tax: +Rs. {checkoutResult.tax.toFixed(2)}</p>
                <p className="text-xs uppercase font-extrabold mt-1.5 border-t border-dashed border-zinc-300 pt-1">
                  Grand Total: Rs. {checkoutResult.grandTotal.toFixed(2)}
                </p>
                <p className="text-[9px] text-zinc-500 font-normal">Method: {checkoutResult.paymentMethod}</p>
              </div>

              <div className="border-t border-dashed border-zinc-300 my-2" />

              <div className="text-center font-bold text-[9px] select-none uppercase">
                Thank you for shopping with us!
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={handlePrintReceipt}>
                Print Receipt
              </Button>
              <Button variant="primary" onClick={() => setCheckoutModalOpen(false)}>
                New Sale
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 2. HELD BILLS DIALOG DRAWER */}
      <Modal
        isOpen={heldBillsOpen}
        onClose={() => setHeldBillsOpen(false)}
        title="Held Sales Manager"
        size="md"
      >
        <div className="space-y-4">
          {heldBills.length > 0 ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {heldBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 border border-border bg-card rounded-xl">
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-foreground leading-snug">
                      Bill #{bill.id.replace('held-', '')}
                    </h5>
                    <p className="text-[10px] text-muted-foreground">
                      Customer: <strong className="text-foreground">{bill.customerName}</strong>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Items Count: {bill.items.reduce((sum, item) => sum + item.quantity, 0)} | Total: <span className="font-semibold text-primary">Rs. {bill.grandTotal.toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleResumeBill(bill.id)} className="h-8">
                      Resume
                    </Button>
                    <button
                      onClick={() => {
                        deleteHeldBill(bill.id);
                        addToast('info', 'Held Bill Deleted', 'Record removed.');
                      }}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-1.5 text-muted-foreground text-xs text-center">
              <FolderOpen className="h-8 w-8 text-zinc-300" />
              <span>No bills are currently on hold.</span>
            </div>
          )}

          <div className="border-t border-border/50 pt-4 flex justify-end">
            <Button variant="outline" onClick={() => setHeldBillsOpen(false)}>
              Close Panel
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

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
  DollarSign, CreditCard, QrCode, Split, CheckCircle,
  UserPlus, User, Phone, X, ChevronDown, Check, MapPin, Mail, Loader2
} from 'lucide-react';

export default function POSPage() {
  const { 
    cart, selectedCustomer, discountRate, taxRate, heldBills, recentSales,
    addToCart, removeFromCart, updateCartQuantity, clearCart, 
    getTotals, setCustomer, setDiscount, setTax, holdBill, resumeBill, deleteHeldBill, checkout 
  } = usePOSStore();
  
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');
  const [productsList, setProductsList] = useState<any[]>(mockProducts);
  const [customersList, setCustomersList] = useState<any[]>(mockCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Customer Search & Dropdown State
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Quick Add Customer Modal States
  const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [customerFormError, setCustomerFormError] = useState('');

  // Checkout Dialog States
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Split' | 'Credit'>('Cash');
  const [amountPaid, setAmountPaid] = useState('0');
  const [changeAmount, setChangeAmount] = useState(0);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);

  // Held Bills Dialog
  const [heldBillsOpen, setHeldBillsOpen] = useState(false);

  // Mounted flag to eliminate SSR / Client hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load products & customers from DB
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProductsList(data);
        }
      })
      .catch(() => addToast('warning', 'Notice', 'Could not load live products from server.'));

    fetch('/api/customers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomersList(data);
        }
      })
      .catch(() => addToast('warning', 'Notice', 'Could not load live customers from server.'));
  }, []);

  // Close customer dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // Filtered Customers based on search query (Name or Mobile)
  const filteredCustomers = customersList.filter((cust) => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = cust.name ? cust.name.toLowerCase().includes(q) : false;
    const phoneMatch = cust.phone ? cust.phone.includes(q) : false;
    return nameMatch || phoneMatch;
  });

  // Handle Quick Add Customer directly from POS
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerFormError('');

    if (!newCustPhone.trim() && !newCustName.trim()) {
      setCustomerFormError('Please enter a customer mobile number or name.');
      return;
    }

    setIsSavingCustomer(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustName.trim() || undefined,
          phone: newCustPhone.trim() || undefined,
          email: newCustEmail.trim() || undefined,
          address: newCustAddress.trim() || undefined,
        })
      });

      const savedCust = await res.json();
      if (!res.ok) {
        throw new Error(savedCust.error || 'Failed to save customer');
      }

      const formattedCust = {
        id: savedCust._id || savedCust.id || `cust-${Date.now()}`,
        name: savedCust.name,
        phone: savedCust.phone,
        email: savedCust.email,
        address: savedCust.address,
        creditLimit: savedCust.creditLimit || 0,
        outstandingBalance: savedCust.outstandingBalance || 0,
        status: 'Active' as const,
      };

      setCustomersList(prev => [formattedCust, ...prev.filter(c => (c.id || c._id) !== formattedCust.id)]);
      setCustomer(formattedCust);
      addToast('success', 'Customer Added & Selected', `${formattedCust.name} (${formattedCust.phone}) selected for POS billing.`);
      
      // Reset form & state
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
      setNewCustAddress('');
      setAddCustomerModalOpen(false);
      setCustomerDropdownOpen(false);
      setCustomerSearch('');
    } catch (err: any) {
      setCustomerFormError(err.message || 'Error saving customer.');
    } finally {
      setIsSavingCustomer(false);
    }
  };

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
      id: `sale-${Math.random().toString(36).substring(2, 9)}`,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      warehouseId: 'wh-1',
      items: [...cart],
      subtotal: totals.subtotal,
      discount: totals.discountAmount,
      tax: totals.taxAmount,
      grandTotal: totals.grandTotal,
      paidAmount: paid,
      dueAmount,
      paymentStatus,
      status: 'Completed' as const,
      paymentMethod
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salePayload)
      });

      let savedSale = null;
      if (res.ok) {
        savedSale = await res.json();
      }
      
      const localSale = checkout(paymentMethod, paid); // clear cart and update store
      setCheckoutResult(savedSale || localSale || salePayload);
      addToast('success', 'Checkout Complete', `Sale invoice ${salePayload.invoiceNumber} recorded.`);
    } catch (error: any) {
      const localSale = checkout(paymentMethod, paid);
      setCheckoutResult(localSale || salePayload);
      addToast('warning', 'Saved in Offline Mode', `Sale invoice ${salePayload.invoiceNumber} recorded in local store.`);
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
    <div className="flex flex-col h-screen w-screen bg-[#f1f5f9] overflow-hidden text-sm">
      
      {/* POS Top Toolbar */}
      <div className="flex h-16 items-center justify-between bg-white dark:bg-card border-b border-border px-4 sm:px-6 select-none shrink-0 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-zinc-500 hover:text-foreground font-bold transition-colors">
            <ArrowLeft className="h-4.5 w-4.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <div className="hidden sm:block h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex bg-primary/5 text-primary border-primary/20 font-bold px-3 py-1">
              Active Terminal 01
            </Badge>
            <Badge variant="outline" className="sm:hidden bg-primary/5 text-primary border-primary/20 font-bold px-2 py-0.5 text-[10px]">
              T01
            </Badge>
            <span className="hidden md:inline text-xs text-muted-foreground">Cashier: <strong className="text-foreground" suppressHydrationWarning>{mounted ? (user?.name || 'Staff') : 'Staff'}</strong></span>
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
            className="relative font-semibold flex items-center gap-1.5 h-9 rounded-lg border-zinc-200 px-2.5 sm:px-3"
          >
            <FolderOpen className="h-4 w-4 text-zinc-500" />
            <span className="hidden sm:inline">Held Bills</span>
            {heldBills.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 rounded-full bg-orange-600 text-[10px] font-extrabold text-white flex items-center justify-center">
                {heldBills.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex border-b border-border bg-card lg:hidden select-none shrink-0">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Browse Products ({filteredProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('cart')}
          className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'cart'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Checkout Cart
          {cart.length > 0 && (
            <Badge className="h-5 min-w-5 px-1 bg-primary text-primary-foreground flex items-center justify-center rounded-full text-[10px] font-extrabold border-0">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </Badge>
          )}
        </button>
      </div>

      {/* POS Content Grid */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        
        {/* Left Side: Product Discovery */}
        <div className={`flex flex-col flex-1 min-w-0 p-4 space-y-4 ${activeTab === 'products' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Filters and Scanner simulation row */}
          <div className="grid gap-2 grid-cols-2 md:grid-cols-3 shrink-0">
            {/* Search Input */}
            <div className="relative col-span-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="pos-search"
                type="text"
                placeholder="Search Product/SKU (F8)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-border/80 bg-white dark:bg-card pl-9 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-xs"
              />
            </div>
            
            {/* Barcode scanner simulator */}
            <form onSubmit={handleBarcodeSubmit} className="relative col-span-1">
              <Barcode className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Barcode/SKU Scan..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="h-10 w-full rounded-xl border border-border/80 bg-white dark:bg-card pl-9 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-xs"
              />
              <button type="submit" className="hidden" />
            </form>

            {/* Warehouse display */}
            <div className="hidden md:flex h-10 rounded-xl border border-border/80 bg-white dark:bg-card px-3 items-center justify-between text-xs col-span-2 md:col-span-1 shadow-xs">
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
                className={`h-9 px-4 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-white dark:bg-card text-muted-foreground hover:bg-muted border border-border/80'
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
                      className="group flex flex-col justify-between p-3.5 bg-white dark:bg-card border border-border/80 hover:border-primary/50 rounded-2xl cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] shadow-xs"
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

          {/* Mobile View Cart Sticky Bar */}
          {cart.length > 0 && (
            <div className="lg:hidden mt-auto p-3.5 bg-primary text-primary-foreground flex items-center justify-between rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 select-none shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 bg-white/10 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold">{cart.reduce((sum, item) => sum + item.quantity, 0)} Items Added</p>
                  <p className="text-[10px] opacity-90 font-medium">Grand Total: Rs. {totals.grandTotal.toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('cart')}
                className="bg-white text-primary px-4 py-2 rounded-lg text-xs font-black hover:bg-zinc-50 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                View Cart & Pay →
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Cart Summary Checkout panel */}
        <div className={`w-full lg:w-96 bg-white dark:bg-card lg:border-l border-border flex flex-col h-full shrink-0 shadow-xs ${activeTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Customer selector header */}
          <div className="p-4 border-b border-border/80 space-y-2 shrink-0 select-none">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3 w-3 text-primary" /> Select Customer
              </label>
              <button
                type="button"
                onClick={() => {
                  setCustomerFormError('');
                  setAddCustomerModalOpen(true);
                }}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-lg transition-colors"
              >
                <UserPlus className="h-3 w-3" />
                <span>+ Add Customer</span>
              </button>
            </div>

            {/* Searchable Customer Dropdown Box */}
            <div className="relative" ref={customerDropdownRef}>
              <div
                onClick={() => setCustomerDropdownOpen(prev => !prev)}
                className="flex items-center justify-between h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground cursor-pointer hover:border-primary/50 transition-colors shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-foreground">{selectedCustomer?.name || 'Walk-In Customer'}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">({selectedCustomer?.phone || '0000000000'})</span>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${customerDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
              </div>

              {/* Popover Dropdown Menu */}
              {customerDropdownOpen && (
                <div className="absolute left-0 right-0 top-12 z-50 rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 p-2 space-y-2">
                  {/* Live Search Input */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search Name or Mobile (e.g. 9876543210)..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="h-8 w-full rounded-lg border border-border bg-muted/30 pl-8 pr-7 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                    {customerSearch && (
                      <button
                        type="button"
                        onClick={() => setCustomerSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Customer Results List */}
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((cust) => {
                        const isSelected = selectedCustomer?.id === cust.id || selectedCustomer?.phone === cust.phone;
                        return (
                          <div
                            key={cust.id || cust._id}
                            onClick={() => {
                              setCustomer(cust);
                              setCustomerDropdownOpen(false);
                              setCustomerSearch('');
                            }}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                              isSelected 
                                ? 'bg-primary/10 text-primary font-bold' 
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-semibold truncate flex items-center gap-1.5">
                                <span>{cust.name}</span>
                                {cust.phone === '0000000000' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">Default</span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Phone className="h-2.5 w-2.5" /> {cust.phone}
                              </div>
                            </div>
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center space-y-2">
                        <p className="text-xs text-muted-foreground">No customer matches &quot;{customerSearch}&quot;</p>
                        <button
                          type="button"
                          onClick={() => {
                            if (/^\d+$/.test(customerSearch.trim())) {
                              setNewCustPhone(customerSearch.trim());
                              setNewCustName('');
                            } else {
                              setNewCustName(customerSearch.trim());
                              setNewCustPhone('');
                            }
                            setAddCustomerModalOpen(true);
                            setCustomerDropdownOpen(false);
                          }}
                          className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1 w-full bg-primary/10 py-1.5 rounded-lg cursor-pointer"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>+ Create &quot;{customerSearch}&quot; as New Customer</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action in dropdown */}
                  <div className="pt-1.5 border-t border-border flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        const defaultWalkIn = customersList.find(c => c.phone === '0000000000') || {
                          id: 'cust-walkin',
                          name: 'Walk-In Customer',
                          phone: '0000000000'
                        };
                        setCustomer(defaultWalkIn);
                        setCustomerDropdownOpen(false);
                        setCustomerSearch('');
                      }}
                      className="text-muted-foreground hover:text-foreground underline cursor-pointer"
                    >
                      Reset Walk-In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddCustomerModalOpen(true);
                        setCustomerDropdownOpen(false);
                      }}
                      className="font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="h-3 w-3" /> + Add New
                    </button>
                  </div>
                </div>
              )}
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
            <div id="receipt-print-area" className="print-area border border-border/80 bg-white text-zinc-950 p-6 rounded-lg font-mono text-xs max-w-sm mx-auto space-y-4">
              <div className="text-center space-y-1 select-none">
                <h3 className="font-extrabold text-sm uppercase">POS ERP SYSTEM</h3>
                <p className="text-[10px]">12 Main St, Tech City</p>
                <p className="text-[10px]">PH: (555) 0199-8877</p>
              </div>
              
              <div className="border-t border-dashed border-zinc-300 my-2" />

              <div className="space-y-1 text-[10px] select-none">
                <p>INVOICE: {checkoutResult?.invoiceNumber || 'INV-2026'}</p>
                <p>DATE: {checkoutResult?.date || new Date().toISOString().split('T')[0]}</p>
                <p>CUSTOMER: {selectedCustomer?.name || 'Walk-In Customer'}</p>
                <p suppressHydrationWarning>CASHIER: {mounted ? (user?.name || 'Staff') : 'Staff'}</p>
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
                  {(checkoutResult?.items || []).map((it: any, index: number) => (
                    <tr key={it.id || it.productId || index}>
                      <td className="py-1 truncate max-w-[120px]">{it.productName}</td>
                      <td className="py-1 text-center">{it.quantity}</td>
                      <td className="py-1 text-right">Rs. {((it.price || 0) * (it.quantity || 1)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-zinc-300 my-2" />

              <div className="space-y-1 font-bold text-[10px] text-right">
                <p>Subtotal: Rs. {(checkoutResult?.subtotal || 0).toFixed(2)}</p>
                <p>Discount: -Rs. {(checkoutResult?.discount || 0).toFixed(2)}</p>
                <p>Tax: +Rs. {(checkoutResult?.tax || 0).toFixed(2)}</p>
                <p className="text-xs uppercase font-extrabold mt-1.5 border-t border-dashed border-zinc-300 pt-1">
                  Grand Total: Rs. {(checkoutResult?.grandTotal || 0).toFixed(2)}
                </p>
                <p className="text-[9px] text-zinc-500 font-normal">Method: {checkoutResult?.paymentMethod || 'Cash'}</p>
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

      {/* 3. QUICK ADD CUSTOMER MODAL (POS) */}
      <Modal
        isOpen={addCustomerModalOpen}
        onClose={() => setAddCustomerModalOpen(false)}
        title="Quick Add Customer (POS)"
        size="md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 select-none">
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-foreground">Fast Customer Registration</p>
              <p className="text-[11px]">Enter mobile number only to quickly register, or add full name &amp; details.</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Mobile Number (Primary) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary" /> Mobile Number *
              </label>
              <input
                type="tel"
                required
                autoFocus
                value={newCustPhone}
                onChange={(e) => { setNewCustPhone(e.target.value); setCustomerFormError(''); }}
                placeholder="e.g. 9876543210 (Required)"
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            {/* Customer Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" /> Customer Name (Optional)
              </label>
              <input
                type="text"
                value={newCustName}
                onChange={(e) => { setNewCustName(e.target.value); setCustomerFormError(''); }}
                placeholder="e.g. Aryan Sharma (Defaults to Customer [Mobile])"
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            {/* Optional Email & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" /> Email (Optional)
                </label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="h-9 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> City / Address (Optional)
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="City or Area"
                  className="h-9 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          {customerFormError && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
              ⚠️ {customerFormError}
            </div>
          )}

          <div className="border-t border-border/50 pt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddCustomerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSavingCustomer}
              className="gap-1.5 font-bold cursor-pointer"
            >
              {!isSavingCustomer && <Check className="h-4 w-4" />}
              Save &amp; Select for POS
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

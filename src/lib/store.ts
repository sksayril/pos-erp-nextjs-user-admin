import { create } from 'zustand';
import { Product, Customer, SaleItem, Sale, User, UserRole } from './types';
import { mockProducts, mockCustomers, mockSales } from './mockData';

// --- UI STORE ---
export type ColorTheme = 'purple' | 'emerald' | 'ocean' | 'sunset' | 'rose';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  language: string;
  colorTheme: ColorTheme;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleTheme: () => void;
  setLanguage: (lang: string) => void;
  setColorTheme: (theme: ColorTheme) => void;
  applyColorTheme: (theme: ColorTheme) => void;
}

export const themePalette: Record<ColorTheme, { primary: string, secondary: string, accent: string, ring: string }> = {
  purple: { primary: '262.1 83.3% 57.8%', secondary: '20.5 90.2% 48.2%', accent: '262.1 83.3% 95%', ring: '262.1 83.3% 57.8%' },
  emerald: { primary: '142.1 76.2% 36.3%', secondary: '200 95% 45%', accent: '142.1 76.2% 95%', ring: '142.1 76.2% 36.3%' },
  ocean: { primary: '217.2 91.2% 59.8%', secondary: '346.8 77.2% 49.8%', accent: '217.2 91.2% 95%', ring: '217.2 91.2% 59.8%' },
  sunset: { primary: '20.5 90.2% 48.2%', secondary: '262.1 83.3% 57.8%', accent: '20.5 90.2% 95%', ring: '20.5 90.2% 48.2%' },
  rose: { primary: '346.8 77.2% 49.8%', secondary: '142.1 76.2% 36.3%', accent: '346.8 77.2% 95%', ring: '346.8 77.2% 49.8%' }
};

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  theme: 'light',
  language: 'en',
  colorTheme: typeof window !== 'undefined' && localStorage.getItem('erp_color_theme')
    ? (localStorage.getItem('erp_color_theme') as ColorTheme)
    : 'purple',
  toggleSidebar: () => set((state) => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return { sidebarCollapsed: !state.sidebarCollapsed };
    }
    return { sidebarOpen: !state.sidebarOpen };
  }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      if (newTheme === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
    }
    return { theme: newTheme };
  }),
  setLanguage: (lang) => set({ language: lang }),
  setColorTheme: (themeName) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp_color_theme', themeName);
    }
    set({ colorTheme: themeName });
    get().applyColorTheme(themeName);
  },
  applyColorTheme: (themeName) => {
    if (typeof window === 'undefined') return;
    const selected = themePalette[themeName] || themePalette.purple;
    const root = window.document.documentElement;
    root.style.setProperty('--primary', selected.primary);
    root.style.setProperty('--secondary', selected.secondary);
    root.style.setProperty('--accent', selected.accent);
    root.style.setProperty('--ring', selected.ring);
  }
}));

// --- AUTH STORE ---
interface AuthState {
  user: User | null;
  login: (email: string, role: UserRole) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: typeof window !== 'undefined' && localStorage.getItem('erp_user')
    ? JSON.parse(localStorage.getItem('erp_user')!)
    : {
        id: 'u-1',
        name: 'Admin',
        email: 'admin@erp.com',
        role: 'Super Admin',
        status: 'Active',
        warehouseId: 'wh-1'
      },
  login: (email, role) => {
    const defaultUser: User = {
      id: 'u-1',
      name: role === 'Super Admin' || role === 'Admin' ? 'Admin' : 'Staff User',
      email: email || 'admin@erp.com',
      role: role,
      status: 'Active',
      warehouseId: 'wh-1'
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp_user', JSON.stringify(defaultUser));
    }
    set({ user: defaultUser });
    return true;
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('erp_user');
    }
    set({ user: null });
  },
  switchRole: (role) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, role };
      if (typeof window !== 'undefined') {
        localStorage.setItem('erp_user', JSON.stringify(updated));
      }
      return { user: updated };
    });
  }
}));

// --- TOAST STORE ---
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

interface ToastState {
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, description?: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, title, description) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, type, title, description }]
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 4000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  }))
}));

// --- POS STORE ---
export interface HeldBill {
  id: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  date: string;
}

interface POSState {
  cart: SaleItem[];
  selectedCustomer: Customer;
  discountRate: number; // percentage discount
  taxRate: number; // percentage tax
  heldBills: HeldBill[];
  recentSales: Sale[];
  
  // Cart Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Checkout math helpers
  getTotals: () => {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
  };
  
  setCustomer: (customer: Customer) => void;
  setDiscount: (rate: number) => void;
  setTax: (rate: number) => void;
  
  // Hold / Resume
  holdBill: () => string | null;
  resumeBill: (heldBillId: string) => void;
  deleteHeldBill: (heldBillId: string) => void;
  
  // Checkout
  checkout: (paymentMethod: Sale['paymentMethod'], paidAmount: number) => Sale | null;
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  selectedCustomer: mockCustomers[0], // Walk-in
  discountRate: 0,
  taxRate: 5, // 5% default POS tax
  heldBills: [],
  recentSales: mockSales,
  
  addToCart: (product, quantity = 1) => {
    set((state) => {
      const existing = state.cart.find((item) => item.productId === product.id);
      let updatedCart = [...state.cart];
      
      const taxPerUnit = (product.sellingPrice * product.taxRate) / 100;
      
      if (existing) {
        updatedCart = state.cart.map((item) => 
          item.productId === product.id 
            ? { 
                ...item, 
                quantity: item.quantity + quantity,
                total: (item.quantity + quantity) * (product.sellingPrice - item.discount + taxPerUnit)
              }
            : item
        );
      } else {
        const newItem: SaleItem = {
          id: `item-${Math.random().toString(36).substring(2, 9)}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: quantity,
          price: product.sellingPrice,
          discount: 0,
          tax: taxPerUnit,
          total: quantity * (product.sellingPrice + taxPerUnit)
        };
        updatedCart.push(newItem);
      }
      return { cart: updatedCart };
    });
  },
  
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter((item) => item.productId !== productId)
  })),
  
  updateCartQuantity: (productId, quantity) => set((state) => {
    if (quantity <= 0) {
      return { cart: state.cart.filter((item) => item.productId !== productId) };
    }
    return {
      cart: state.cart.map((item) => 
        item.productId === productId
          ? { 
              ...item, 
              quantity, 
              total: quantity * (item.price - item.discount + item.tax)
            }
          : item
      )
    };
  }),
  
  clearCart: () => set({ cart: [], discountRate: 0, taxRate: 5, selectedCustomer: mockCustomers[0] }),
  
  getTotals: () => {
    const { cart, discountRate, taxRate } = get();
    // Subtotal = Sum of raw item price * quantity
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Discount amount based on flat percentage
    const discountAmount = (subtotal * discountRate) / 100;
    // Subtotal after discount
    const discountedSubtotal = subtotal - discountAmount;
    // Tax amount calculated after discount
    const taxAmount = (discountedSubtotal * taxRate) / 100;
    const grandTotal = discountedSubtotal + taxAmount;
    
    return {
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal
    };
  },
  
  setCustomer: (customer) => set({ selectedCustomer: customer }),
  setDiscount: (rate) => set({ discountRate: Math.max(0, Math.min(100, rate)) }),
  setTax: (rate) => set({ taxRate: Math.max(0, rate) }),
  
  holdBill: () => {
    const { cart, selectedCustomer, getTotals } = get();
    if (cart.length === 0) return null;
    
    const totals = getTotals();
    const id = `held-${Math.random().toString(36).substring(2, 9)}`;
    const newHeldBill: HeldBill = {
      id,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items: cart,
      subtotal: totals.subtotal,
      discount: totals.discountAmount,
      tax: totals.taxAmount,
      grandTotal: totals.grandTotal,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    set((state) => ({
      heldBills: [newHeldBill, ...state.heldBills],
      cart: [],
      selectedCustomer: mockCustomers[0],
      discountRate: 0
    }));
    
    return id;
  },
  
  resumeBill: (heldBillId) => set((state) => {
    const bill = state.heldBills.find((b) => b.id === heldBillId);
    if (!bill) return {};
    
    const customer = mockCustomers.find((c) => c.id === bill.customerId) || mockCustomers[0];
    
    return {
      cart: bill.items,
      selectedCustomer: customer,
      heldBills: state.heldBills.filter((b) => b.id !== heldBillId)
    };
  }),
  
  deleteHeldBill: (heldBillId) => set((state) => ({
    heldBills: state.heldBills.filter((b) => b.id !== heldBillId)
  })),
  
  checkout: (paymentMethod, paidAmount) => {
    const { cart, selectedCustomer, getTotals, clearCart } = get();
    if (cart.length === 0) return null;
    
    const totals = getTotals();
    const grandTotal = totals.grandTotal;
    const dueAmount = Math.max(0, grandTotal - paidAmount);
    const paymentStatus = dueAmount === 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Due';
    
    const newSale: Sale = {
      id: `sale-${Math.random().toString(36).substring(2, 9)}`,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      warehouseId: 'wh-1',
      items: cart,
      subtotal: totals.subtotal,
      discount: totals.discountAmount,
      tax: totals.taxAmount,
      grandTotal,
      paidAmount,
      dueAmount,
      paymentStatus,
      status: 'Completed',
      paymentMethod
    };
    
    set((state) => ({
      recentSales: [newSale, ...state.recentSales]
    }));
    
    // Clear cart on successful checkout
    clearCart();
    
    return newSale;
  }
}));

// --- PERMISSIONS STORE ---
export interface RolePermissions {
  dashboard: boolean;
  pos: boolean;
  products: boolean;
  purchases: boolean;
  sales: boolean;
  expenses: boolean;
  quotations: boolean;
  transfers: boolean;
  returns: boolean;
  accounting: boolean;
  hrm: boolean;
  people: boolean;
  reports: boolean;
  settings: boolean;
  distributorUsers: boolean;
  documentation: boolean;
}

interface PermissionState {
  permissions: Record<string, RolePermissions>;
  loadPermissions: () => Promise<void>;
  updatePermission: (role: string, moduleKey: keyof RolePermissions, allowed: boolean) => Promise<void>;
  hasPermission: (role: string, moduleKey: keyof RolePermissions) => boolean;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: {
    'Super Admin': { dashboard: true, pos: true, products: true, purchases: true, sales: true, expenses: true, quotations: true, transfers: true, returns: true, accounting: true, hrm: true, people: true, reports: true, settings: true, distributorUsers: true, documentation: true },
    'Admin': { dashboard: true, pos: true, products: true, purchases: true, sales: true, expenses: true, quotations: true, transfers: true, returns: true, accounting: true, hrm: false, people: true, reports: true, settings: true, distributorUsers: true, documentation: true },
    'HR Manager': { dashboard: true, pos: false, products: false, purchases: false, sales: false, expenses: false, quotations: false, transfers: false, returns: false, accounting: false, hrm: true, people: true, reports: false, settings: false, distributorUsers: false, documentation: true },
    'Accountant': { dashboard: true, pos: false, products: false, purchases: false, sales: false, expenses: true, quotations: false, transfers: false, returns: false, accounting: true, hrm: false, people: false, reports: true, settings: false, distributorUsers: false, documentation: true },
    'Cashier': { dashboard: false, pos: true, products: false, purchases: false, sales: true, expenses: false, quotations: false, transfers: false, returns: false, accounting: false, hrm: false, people: false, reports: false, settings: false, distributorUsers: false, documentation: true },
  },
  loadPermissions: async () => {
    try {
      const res = await fetch('/api/permissions');
      if (res.ok) {
        const data = await res.json();
        set({ permissions: data });
      }
    } catch (err) {
      console.error('Failed to load permissions from MongoDB:', err);
    }
  },
  updatePermission: async (role, moduleKey, allowed) => {
    if (role === 'Super Admin') return;
    
    const currentRolePerms = get().permissions[role] || {
      dashboard: false, pos: false, products: false, purchases: false, sales: false, expenses: false,
      quotations: false, transfers: false, returns: false, accounting: false, hrm: false, people: false,
      reports: false, settings: false, distributorUsers: false, documentation: false
    };
    
    const updatedRolePerms = {
      ...currentRolePerms,
      [moduleKey]: allowed
    };

    set((state) => ({
      permissions: {
        ...state.permissions,
        [role]: updatedRolePerms
      }
    }));

    try {
      await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          modules: updatedRolePerms
        })
      });
    } catch (err) {
      console.error('Failed to save permission update to MongoDB:', err);
    }
  },
  hasPermission: (role, moduleKey) => {
    const state = get();
    if (role === 'Super Admin') return true;
    const roleMap = state.permissions[role];
    if (!roleMap) return false;
    return roleMap[moduleKey] ?? false;
  },
}));

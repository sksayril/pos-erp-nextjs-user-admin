import mongoose, { Schema } from 'mongoose';

// --- PRODUCT SCHEMA ---
const ProductSchema = new Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  barcode: { type: String, required: true },
  categoryId: { type: String, required: true },
  brandId: { type: String },
  unitId: { type: String },
  purchasePrice: { type: Number, required: true, default: 0 },
  sellingPrice: { type: Number, required: true, default: 0 },
  wholesalePrice: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxType: { type: String, enum: ['Exclusive', 'Inclusive'], default: 'Exclusive' },
  openingStock: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  maxStock: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  image: { type: String }, // AWS S3 Image URL
  rack: { type: String }
}, { timestamps: true });

// --- CUSTOMER SCHEMA ---
const CustomerSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  creditLimit: { type: Number, default: 0 },
  outstandingBalance: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// --- SALE ITEM SUB-SCHEMA ---
const SaleItemSchema = new Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

// --- SALE SCHEMA ---
const SaleSchema = new Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  warehouseId: { type: String, default: 'wh-1' },
  items: [SaleItemSchema],
  subtotal: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  paidAmount: { type: Number, required: true, default: 0 },
  dueAmount: { type: Number, required: true, default: 0 },
  paymentStatus: { type: String, enum: ['Paid', 'Partial', 'Due'], default: 'Paid' },
  status: { type: String, enum: ['Completed', 'Pending', 'Cancelled'], default: 'Completed' },
  paymentMethod: { type: String, required: true }
}, { timestamps: true });

// --- PURCHASE ITEM SUB-SCHEMA ---
const PurchaseItemSchema = new Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

// --- PURCHASE SCHEMA ---
const PurchaseSchema = new Schema({
  purchaseNumber: { type: String, required: true, unique: true },
  invoiceNumber: { type: String },
  date: { type: String, required: true },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  warehouseId: { type: String, default: 'wh-1' },
  items: [PurchaseItemSchema],
  subtotal: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  paidAmount: { type: Number, required: true, default: 0 },
  dueAmount: { type: Number, required: true, default: 0 },
  paymentStatus: { type: String, enum: ['Paid', 'Partial', 'Due'], default: 'Paid' },
  status: { type: String, enum: ['Received', 'Pending', 'Ordered'], default: 'Received' },
  paymentMethod: { type: String, required: true }
}, { timestamps: true });

// Export compiled mongoose models, reuse existing models if cached
export const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const CustomerModel = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
export const SaleModel = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);
export const PurchaseModel = mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);
export const SupplierModel = mongoose.models.Supplier || mongoose.model('Supplier', new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  outstandingPayable: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true }));
export const ExpenseModel = mongoose.models.Expense || mongoose.model('Expense', new Schema({
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  reference: { type: String },
  description: { type: String }
}, { timestamps: true }));

export const PermissionModel = mongoose.models.Permission || mongoose.model('Permission', new Schema({
  role: { type: String, required: true, unique: true },
  modules: {
    dashboard: { type: Boolean, default: false },
    pos: { type: Boolean, default: false },
    products: { type: Boolean, default: false },
    purchases: { type: Boolean, default: false },
    sales: { type: Boolean, default: false },
    expenses: { type: Boolean, default: false },
    quotations: { type: Boolean, default: false },
    transfers: { type: Boolean, default: false },
    returns: { type: Boolean, default: false },
    accounting: { type: Boolean, default: false },
    hrm: { type: Boolean, default: false },
    people: { type: Boolean, default: false },
    reports: { type: Boolean, default: false },
    settings: { type: Boolean, default: false },
    distributorUsers: { type: Boolean, default: false },
    documentation: { type: Boolean, default: false },
  }
}, { timestamps: true }));

import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { PermissionModel } from '../../../lib/models';

const defaultPermissionsMatrix = [
  {
    role: 'Super Admin',
    modules: { dashboard: true, pos: true, products: true, purchases: true, sales: true, expenses: true, quotations: true, transfers: true, returns: true, accounting: true, hrm: true, people: true, reports: true, settings: true, distributorUsers: true, documentation: true }
  },
  {
    role: 'Admin',
    modules: { dashboard: true, pos: true, products: true, purchases: true, sales: true, expenses: true, quotations: true, transfers: true, returns: true, accounting: true, hrm: false, people: true, reports: true, settings: true, distributorUsers: true, documentation: true }
  },
  {
    role: 'HR Manager',
    modules: { dashboard: true, pos: false, products: false, purchases: false, sales: false, expenses: false, quotations: false, transfers: false, returns: false, accounting: false, hrm: true, people: true, reports: false, settings: false, distributorUsers: false, documentation: true }
  },
  {
    role: 'Accountant',
    modules: { dashboard: true, pos: false, products: false, purchases: false, sales: false, expenses: true, quotations: false, transfers: false, returns: false, accounting: true, hrm: false, people: false, reports: true, settings: false, distributorUsers: false, documentation: true }
  },
  {
    role: 'Cashier',
    modules: { dashboard: false, pos: true, products: false, purchases: false, sales: true, expenses: false, quotations: false, transfers: false, returns: false, accounting: false, hrm: false, people: false, reports: false, settings: false, distributorUsers: false, documentation: true }
  }
];

export async function GET() {
  try {
    await connectDB();
    let permissions = await PermissionModel.find({});

    // If database is empty, seed it with default permission matrix configuration
    if (permissions.length === 0) {
      await PermissionModel.insertMany(defaultPermissionsMatrix);
      permissions = await PermissionModel.find({});
    }

    // Convert list to mapped Record<role, modules>
    const matrix: Record<string, any> = {};
    permissions.forEach((p) => {
      matrix[p.role] = p.modules;
    });

    return NextResponse.json(matrix);
  } catch (error: any) {
    console.error('Fetch Permissions Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch permissions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { role, modules } = body;

    if (!role || !modules) {
      return NextResponse.json({ error: 'Missing role or modules configuration payload' }, { status: 400 });
    }

    const updated = await PermissionModel.findOneAndUpdate(
      { role },
      { $set: { modules } },
      { new: true, upsert: true }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update Permission Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save permission config' }, { status: 500 });
  }
}

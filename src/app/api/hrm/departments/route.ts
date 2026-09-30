import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { DepartmentModel, EmployeeModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let departments = await DepartmentModel.find().sort({ createdAt: -1 });

    if (departments.length === 0) {
      const defaultDepts = [
        {
          departmentId: 'DEP-101',
          name: 'Sales & Marketing',
          code: 'SALES',
          headOfDepartment: 'Rajesh Sharma',
          employeeCount: 4,
          budget: 250000,
          description: 'Handles retail POS, corporate client sales, and regional marketing campaigns.',
          status: 'Active'
        },
        {
          departmentId: 'DEP-102',
          name: 'Warehouse & Logistics',
          code: 'LOGISTICS',
          headOfDepartment: 'Sunil Verma',
          employeeCount: 3,
          budget: 180000,
          description: 'Manages godown stock, transfers, delivery challans, and carrier transport.',
          status: 'Active'
        },
        {
          departmentId: 'DEP-103',
          name: 'Accounts & Finance',
          code: 'FINANCE',
          headOfDepartment: 'Priya Patel',
          employeeCount: 2,
          budget: 150000,
          description: 'Responsible for general ledgers, tax filings (GST/VAT), and vendor payments.',
          status: 'Active'
        },
        {
          departmentId: 'DEP-104',
          name: 'Human Resources (HR)',
          code: 'HRM',
          headOfDepartment: 'Sneha Roy',
          employeeCount: 2,
          budget: 120000,
          description: 'Oversees employee onboarding, payroll distribution, and leave compliance.',
          status: 'Active'
        },
        {
          departmentId: 'DEP-105',
          name: 'IT & Operations',
          code: 'TECH',
          headOfDepartment: 'Ankit Mehta',
          employeeCount: 2,
          budget: 200000,
          description: 'Maintains POS cloud infrastructure, hardware scanners, and database backups.',
          status: 'Active'
        }
      ];
      departments = await DepartmentModel.insertMany(defaultDepts);
    }

    // Refresh employee counts dynamically
    for (const dep of departments) {
      const count = await EmployeeModel.countDocuments({ department: dep.name, status: 'Active' });
      if (count > 0 && dep.employeeCount !== count) {
        dep.employeeCount = count;
        await dep.save();
      }
    }

    return NextResponse.json(departments);
  } catch (error: any) {
    console.error('HRM Departments GET Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, code, headOfDepartment, budget, description, status } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Department Name and Code are required' }, { status: 400 });
    }

    const count = await DepartmentModel.countDocuments();
    const departmentId = `DEP-${101 + count}`;

    const newDept = await DepartmentModel.create({
      departmentId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      headOfDepartment: headOfDepartment?.trim() || 'Unassigned',
      employeeCount: 0,
      budget: Number(budget) || 0,
      description: description?.trim() || '',
      status: status || 'Active'
    });

    return NextResponse.json(newDept, { status: 201 });
  } catch (error: any) {
    console.error('HRM Department POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create department' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, departmentId, ...updates } = body;

    const updated = await DepartmentModel.findOneAndUpdate(
      _id ? { _id } : { departmentId },
      { $set: updates },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('HRM Department PUT Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update department' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required to delete department' }, { status: 400 });
    }

    await DepartmentModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Department deleted' });
  } catch (error: any) {
    console.error('HRM Department DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete department' }, { status: 500 });
  }
}

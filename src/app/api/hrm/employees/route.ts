import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { EmployeeModel, DepartmentModel } from '../../../../lib/models';
import { mockEmployees } from '../../../../lib/mockData';

export async function GET() {
  try {
    await connectDB();
    let employees = await EmployeeModel.find().sort({ createdAt: -1 });

    // Seed default employees if empty
    if (employees.length === 0) {
      const defaultEmployees = mockEmployees.map((emp, i) => ({
        employeeId: emp.employeeId || `EMP-100${i + 1}`,
        name: emp.name,
        email: `${emp.name.toLowerCase().replace(/\s+/g, '.')}@erp.com`,
        phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
        department: emp.department || 'Sales',
        designation: emp.designation || 'Specialist',
        joinDate: '2024-01-15',
        salary: emp.salary || 35000,
        salaryType: 'Monthly',
        status: emp.status || 'Active',
        avatar: `https://images.unsplash.com/photo-${1534528741775 + i}?w=100&h=100&fit=crop&crop=faces`,
        address: 'Sector 5, Salt Lake, Kolkata, India',
        bankName: 'HDFC Bank Ltd',
        bankAccount: `50100${Math.floor(1000000 + Math.random() * 9000000)}`,
        emergencyContact: '+91 9123456780'
      }));
      employees = await EmployeeModel.insertMany(defaultEmployees);
    }

    return NextResponse.json(employees);
  } catch (error: any) {
    console.error('HRM Employees GET Error:', error);
    return NextResponse.json(mockEmployees);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { 
      name, email, phone, department, designation, 
      joinDate, salary, salaryType, status, address,
      emergencyContact, bankName, bankAccount, panGst 
    } = body;

    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Name, Email, and Phone number are required fields.' }, { status: 400 });
    }

    const count = await EmployeeModel.countDocuments();
    const employeeId = `EMP-${1001 + count}`;

    const newEmployee = await EmployeeModel.create({
      employeeId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      department: department || 'General',
      designation: designation || 'Staff',
      joinDate: joinDate || new Date().toISOString().split('T')[0],
      salary: Number(salary) || 30000,
      salaryType: salaryType || 'Monthly',
      status: status || 'Active',
      address: address?.trim() || '',
      emergencyContact: emergencyContact?.trim() || '',
      bankName: bankName?.trim() || '',
      bankAccount: bankAccount?.trim() || '',
      panGst: panGst?.trim() || '',
    });

    // Update department employee count if department exists
    if (department) {
      await DepartmentModel.findOneAndUpdate(
        { name: department },
        { $inc: { employeeCount: 1 } }
      );
    }

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error: any) {
    console.error('HRM Employee POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create employee' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, employeeId, ...updates } = body;

    if (!_id && !employeeId) {
      return NextResponse.json({ error: 'Employee ID is required for update' }, { status: 400 });
    }

    const updated = await EmployeeModel.findOneAndUpdate(
      _id ? { _id } : { employeeId },
      { $set: updates },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('HRM Employee PUT Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required to delete employee' }, { status: 400 });
    }

    await EmployeeModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Employee deleted' });
  } catch (error: any) {
    console.error('HRM Employee DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete employee' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { LeaveRequestModel, EmployeeModel } from '../../../../lib/models';

export async function GET() {
  try {
    await connectDB();
    let records = await LeaveRequestModel.find().sort({ createdAt: -1 });

    // Auto-seed initial leaves if empty
    if (records.length === 0) {
      const employees = await EmployeeModel.find({ status: 'Active' });
      if (employees.length > 0) {
        const seedData = [
          {
            leaveId: `LEV-${Date.now()}-1`,
            employeeId: employees[0]?.employeeId || 'EMP-1001',
            employeeName: employees[0]?.name || 'John Doe',
            department: employees[0]?.department || 'Sales',
            leaveType: 'Casual Leave',
            startDate: '2026-10-05',
            endDate: '2026-10-07',
            totalDays: 3,
            reason: 'Attending family wedding ceremony out of station.',
            status: 'Pending',
            appliedOn: '2026-09-30'
          },
          {
            leaveId: `LEV-${Date.now()}-2`,
            employeeId: employees[1]?.employeeId || 'EMP-1002',
            employeeName: employees[1]?.name || 'Jane Smith',
            department: employees[1]?.department || 'Operations',
            leaveType: 'Sick Leave',
            startDate: '2026-09-28',
            endDate: '2026-09-29',
            totalDays: 2,
            reason: 'Recovering from seasonal viral fever.',
            status: 'Approved',
            approvedBy: 'Super Admin',
            appliedOn: '2026-09-27'
          }
        ];
        records = await LeaveRequestModel.insertMany(seedData);
      }
    }

    return NextResponse.json(records);
  } catch (error: any) {
    console.error('HRM Leave GET Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { employeeId, employeeName, department, leaveType, startDate, endDate, totalDays, reason } = body;

    if (!employeeId || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Employee, Dates, and Reason are required' }, { status: 400 });
    }

    const leaveId = `LEV-${Date.now().toString().slice(-6)}`;

    const newLeave = await LeaveRequestModel.create({
      leaveId,
      employeeId,
      employeeName: employeeName || 'Employee',
      department: department || 'General',
      leaveType: leaveType || 'Casual Leave',
      startDate,
      endDate,
      totalDays: Number(totalDays) || 1,
      reason: reason.trim(),
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0]
    });

    return NextResponse.json(newLeave, { status: 201 });
  } catch (error: any) {
    console.error('HRM Leave POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit leave request' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, leaveId, status, approvedBy } = body;

    const updated = await LeaveRequestModel.findOneAndUpdate(
      _id ? { _id } : { leaveId },
      {
        $set: {
          status: status || 'Approved',
          approvedBy: approvedBy || 'Admin'
        }
      },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('HRM Leave PUT Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update leave request' }, { status: 500 });
  }
}

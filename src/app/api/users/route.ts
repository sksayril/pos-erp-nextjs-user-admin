import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { UserAccountModel, hashPassword } from '../../../lib/models';
import { mockUsers } from '../../../lib/mockData';

// Seed default users if database is empty
const defaultSeedUsers = mockUsers.map(u => ({
  name: u.name,
  email: u.email.toLowerCase(),
  password: 'password123',
  passwordHash: hashPassword('password123'),
  role: u.role,
  status: u.status,
  phone: u.phone,
  warehouseId: u.warehouseId || 'wh-1',
}));

export async function GET() {
  try {
    await connectDB();
    let users = await UserAccountModel.find({}).sort({ createdAt: -1 });

    if (users.length === 0) {
      await UserAccountModel.insertMany(defaultSeedUsers);
      users = await UserAccountModel.find({}).sort({ createdAt: -1 });
    }

    const mappedUsers = users.map(u => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      password: u.password || 'password123',
      role: u.role,
      status: u.status,
      phone: u.phone || '',
      warehouseId: u.warehouseId || 'wh-1',
      businessName: u.businessName,
      address: u.address,
      city: u.city,
      state: u.state,
      country: u.country,
      subscriptionKey: u.subscriptionKey,
      createdAt: u.createdAt,
    }));

    return NextResponse.json(mappedUsers);
  } catch (error: any) {
    console.error('Fetch Users Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users from database.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, password, role, status = 'Active', phone, warehouseId = 'wh-1', createdBy } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await UserAccountModel.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json({ error: 'A user with this email address already exists in database.' }, { status: 400 });
    }

    const newUser = await UserAccountModel.create({
      name: name.trim(),
      email: cleanEmail,
      password: password,
      passwordHash: hashPassword(password),
      role: role || 'Cashier',
      status: status,
      phone: phone?.trim(),
      warehouseId: warehouseId,
      createdBy: createdBy || 'Super Admin',
    });

    return NextResponse.json({
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
      status: newUser.status,
      phone: newUser.phone,
      warehouseId: newUser.warehouseId,
      message: 'User created in MongoDB database successfully.'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create User Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user in database.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, name, email, password, role, status, phone, warehouseId } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const updateFields: any = {};
    if (name) updateFields.name = name.trim();
    if (email) updateFields.email = email.trim().toLowerCase();
    if (role) updateFields.role = role;
    if (status) updateFields.status = status;
    if (phone !== undefined) updateFields.phone = phone;
    if (warehouseId) updateFields.warehouseId = warehouseId;
    if (password) {
      updateFields.password = password;
      updateFields.passwordHash = hashPassword(password);
    }

    const updatedUser = await UserAccountModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found in database.' }, { status: 404 });
    }

    return NextResponse.json({
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      password: updatedUser.password,
      role: updatedUser.role,
      status: updatedUser.status,
      phone: updatedUser.phone,
      warehouseId: updatedUser.warehouseId,
      message: 'User updated in MongoDB successfully.'
    });
  } catch (error: any) {
    console.error('Update User Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const targetUser = await UserAccountModel.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (targetUser.role === 'Super Admin') {
      return NextResponse.json({ error: 'Cannot delete Super Admin account.' }, { status: 403 });
    }

    await UserAccountModel.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'User deleted from MongoDB successfully.' });
  } catch (error: any) {
    console.error('Delete User Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user.' }, { status: 500 });
  }
}

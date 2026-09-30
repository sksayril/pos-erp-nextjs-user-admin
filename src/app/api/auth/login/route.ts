import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { UserAccountModel, SubscriptionModel, verifyPassword } from '../../../../lib/models';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await UserAccountModel.findOne({ email: cleanEmail });

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email address.' }, { status: 404 });
    }

    if (user.status === 'Inactive') {
      return NextResponse.json({ error: 'Your account has been deactivated. Please contact your administrator.' }, { status: 403 });
    }

    // Check password
    const isMatch = (user.password === password) || verifyPassword(password, user.passwordHash || '');
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect password. Please check your credentials.' }, { status: 401 });
    }

    // Update last login timestamp in MongoDB
    user.lastLogin = new Date();
    await user.save();

    // Check MongoDB subscription status
    const sub = await SubscriptionModel.findOne({ userEmail: cleanEmail });

    return NextResponse.json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        warehouseId: user.warehouseId,
        phone: user.phone,
        avatar: user.avatar,
        businessName: user.businessName,
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        subscriptionKey: user.subscriptionKey || sub?.activationKey,
        subscriptionExpiry: user.subscriptionExpiry || sub?.expiryDate,
      },
      subscription: {
        isSubscribed: Boolean(sub?.status === 'Active' || user.subscriptionKey),
        activationKey: user.subscriptionKey || sub?.activationKey || '',
        expiryDate: user.subscriptionExpiry || sub?.expiryDate || '',
      }
    });
  } catch (error: any) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: error.message || 'Authentication error occurred.' }, { status: 500 });
  }
}

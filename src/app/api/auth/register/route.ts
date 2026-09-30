import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { UserAccountModel, SubscriptionModel, hashPassword } from '../../../../lib/models';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      name,
      email,
      password,
      phone,
      role = 'Super Admin',
      businessName,
      address,
      city,
      state,
      country,
      postalCode,
      activationKey
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate user in MongoDB
    const existingUser = await UserAccountModel.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists in database.' },
        { status: 400 }
      );
    }

    // Generate or format activation key
    const generatedKey = activationKey || `ERP-ACTV-${Math.floor(1000 + Math.random() * 9000)}-REG9-${Date.now().toString().slice(-4)}-2026`;
    const expiryDate = new Date(Date.now() + 365 * 86400 * 1000).toISOString().split('T')[0];
    const activatedAt = new Date().toISOString().split('T')[0];

    // 1. Save Super Admin in MongoDB UserAccountModel
    const newUser = await UserAccountModel.create({
      name: name.trim(),
      email: cleanEmail,
      password: password, // preserved for UI registry
      passwordHash: hashPassword(password),
      role: role,
      status: 'Active',
      phone: phone?.trim(),
      businessName: businessName?.trim(),
      address: address?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      country: country?.trim(),
      postalCode: postalCode?.trim(),
      subscriptionKey: generatedKey,
      subscriptionPlan: '1-Year Full ERP License',
      subscriptionExpiry: expiryDate,
      lastLogin: new Date()
    });

    // 2. Save active Subscription record in MongoDB SubscriptionModel
    try {
      await SubscriptionModel.findOneAndUpdate(
        { userEmail: cleanEmail },
        {
          $set: {
            businessName: businessName?.trim(),
            activationKey: generatedKey,
            planName: '1-Year Full ERP License',
            amount: 5999,
            status: 'Active',
            expiryDate,
            activatedAt,
            paymentMethod: 'Verified Signup Activation'
          }
        },
        { upsert: true, new: true }
      );
    } catch (subErr) {
      console.warn('SubscriptionModel sync warning:', subErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Super Admin registered and saved to MongoDB database successfully.',
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        phone: newUser.phone,
        businessName: newUser.businessName,
        address: newUser.address,
        city: newUser.city,
        state: newUser.state,
        country: newUser.country,
        postalCode: newUser.postalCode,
        subscriptionKey: newUser.subscriptionKey,
        subscriptionExpiry: newUser.subscriptionExpiry,
      },
      subscription: {
        isSubscribed: true,
        activationKey: generatedKey,
        expiryDate,
        activatedAt,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register user in database.' },
      { status: 500 }
    );
  }
}

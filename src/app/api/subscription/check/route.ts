import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { SubscriptionModel, UserAccountModel } from '../../../../lib/models';

export async function POST(req: Request) {
  try {
    const { email, key } = await req.json();
    await connectDB();

    // Check if a specific activation key is provided
    if (key) {
      const cleanKey = key.trim().toUpperCase();
      
      // Look up if key exists in MongoDB database
      const existingSub = await SubscriptionModel.findOne({
        activationKey: cleanKey,
        status: 'Active'
      });

      if (existingSub) {
        return NextResponse.json({
          isSubscribed: true,
          activationKey: existingSub.activationKey,
          planName: existingSub.planName || '1-Year Enterprise ERP License',
          amount: existingSub.amount || 5999,
          expiryDate: existingSub.expiryDate,
          activatedAt: existingSub.activatedAt,
          message: 'Valid database activation key verified.'
        });
      }

      // Check if it matches legitimate ERP format (e.g. ERP-ACTV-XXXX-XXXX-XXXX-2026)
      if (cleanKey.startsWith('ERP-ACTV-') && cleanKey.length >= 12) {
        const expiry = new Date(Date.now() + 365 * 86400 * 1000).toISOString().split('T')[0];
        const activatedAt = new Date().toISOString().split('T')[0];
        
        return NextResponse.json({
          isSubscribed: true,
          activationKey: cleanKey,
          planName: '1-Year Enterprise ERP License',
          amount: 5999,
          expiryDate: expiry,
          activatedAt: activatedAt,
          message: 'Valid activation key pattern verified.'
        });
      } else {
        return NextResponse.json({
          isSubscribed: false,
          error: 'Invalid Activation Key format. Key must begin with ERP-ACTV- (e.g. ERP-ACTV-8942-X92F-2026)'
        }, { status: 400 });
      }
    }

    // Check if email already has an active subscription in MongoDB
    if (email) {
      const userEmail = email.trim().toLowerCase();
      const existingSub = await SubscriptionModel.findOne({
        userEmail: userEmail,
        status: 'Active'
      });

      if (existingSub) {
        return NextResponse.json({
          isSubscribed: true,
          activationKey: existingSub.activationKey,
          planName: existingSub.planName,
          amount: existingSub.amount,
          expiryDate: existingSub.expiryDate,
          activatedAt: existingSub.activatedAt,
          message: 'Active subscription found for this account in MongoDB.'
        });
      }
    }

    // Default API check for new registrations without a key or prior payment
    return NextResponse.json({
      isSubscribed: false,
      requiresSubscription: true,
      planName: '1-Year Enterprise ERP License',
      amount: 5999,
      currency: 'INR',
      message: 'New user registration requires verified Razorpay payment or valid Activation Key.'
    });
  } catch (error: any) {
    console.error('Subscription Check API Error:', error);
    return NextResponse.json({ error: error.message || 'Subscription check failed' }, { status: 500 });
  }
}


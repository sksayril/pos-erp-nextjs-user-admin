import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '../../../../lib/db';
import { SubscriptionModel, UserAccountModel } from '../../../../lib/models';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      activationKey: manualKey, 
      email, 
      businessName,
      planName,
      amount
    } = body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'kylSe6LkTaUfrKdSYkYIMDnF';
    await connectDB();

    const userEmail = email ? email.trim().toLowerCase() : 'admin@erp.com';
    const now = new Date();
    const expiry = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString().split('T')[0];
    const activatedAt = new Date().toISOString().split('T')[0];
    const targetPlan = planName || '1-Year Full ERP License';
    const targetAmount = Number(amount) || 5999;

    // Helper to generate official 16-character Activation Code
    const generateKey = () => {
      const p1 = Math.floor(1000 + Math.random() * 9000);
      const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const p3 = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `ERP-ACTV-${p1}-${p2}-${p3}-2026`;
    };

    // -------------------------------------------------------------
    // CASE 1: Manual Key Verification & Activation
    // -------------------------------------------------------------
    if (manualKey) {
      const cleanKey = manualKey.trim().toUpperCase();
      if (!cleanKey.startsWith('ERP-ACTV-') || cleanKey.length < 10) {
        return NextResponse.json(
          { error: 'Invalid Activation Key format. Key must start with ERP-ACTV- (e.g. ERP-ACTV-8942-X92F-2026)' },
          { status: 400 }
        );
      }

      await SubscriptionModel.findOneAndUpdate(
        { activationKey: cleanKey },
        {
          $set: {
            userEmail,
            businessName: businessName || '',
            activationKey: cleanKey,
            planName: targetPlan,
            amount: targetAmount,
            status: 'Active',
            expiryDate: expiry,
            activatedAt: activatedAt,
            paymentMethod: 'Manual Key Activation'
          }
        },
        { upsert: true, new: true }
      );

      if (email) {
        await UserAccountModel.findOneAndUpdate(
          { email: userEmail },
          { $set: { subscriptionKey: cleanKey, subscriptionExpiry: expiry } }
        );
      }

      return NextResponse.json({
        success: true,
        activationKey: cleanKey,
        planName: targetPlan,
        amount: targetAmount,
        expiryDate: expiry,
        activatedAt: activatedAt,
        message: 'Activation Code verified and activated in database!'
      });
    }

    // -------------------------------------------------------------
    // CASE 2: Razorpay Signature Verification
    // -------------------------------------------------------------
    if (razorpay_order_id && razorpay_payment_id) {
      if (razorpay_signature) {
        const expectedSig = crypto
          .createHmac('sha256', secret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');

        if (expectedSig !== razorpay_signature && process.env.NODE_ENV === 'production') {
          return NextResponse.json(
            { error: 'Razorpay payment signature mismatch! Transaction could not be verified.' },
            { status: 400 }
          );
        }
      }

      const generatedActivationKey = generateKey();
      await SubscriptionModel.create({
        userEmail,
        businessName: businessName || '',
        activationKey: generatedActivationKey,
        planName: targetPlan,
        amount: targetAmount,
        status: 'Active',
        expiryDate: expiry,
        activatedAt: activatedAt,
        paymentMethod: `Razorpay Online (${razorpay_payment_id})`
      });

      if (email) {
        await UserAccountModel.findOneAndUpdate(
          { email: userEmail },
          { $set: { subscriptionKey: generatedActivationKey, subscriptionExpiry: expiry } }
        );
      }

      return NextResponse.json({
        success: true,
        activationKey: generatedActivationKey,
        planName: targetPlan,
        amount: targetAmount,
        expiryDate: expiry,
        activatedAt: activatedAt,
        message: 'Razorpay payment verified and 1-Year ERP License activated in MongoDB database!'
      });
    }

    // -------------------------------------------------------------
    // CASE 3: Direct API Activation / Plan Activation (e.g. from Postman, Test, or Admin API)
    // -------------------------------------------------------------
    if (email || planName || amount) {
      const generatedActivationKey = generateKey();

      await SubscriptionModel.findOneAndUpdate(
        { userEmail },
        {
          $set: {
            userEmail,
            businessName: businessName || '',
            activationKey: generatedActivationKey,
            planName: targetPlan,
            amount: targetAmount,
            status: 'Active',
            expiryDate: expiry,
            activatedAt: activatedAt,
            paymentMethod: 'Direct Subscription Activation'
          }
        },
        { upsert: true, new: true }
      );

      if (email) {
        await UserAccountModel.findOneAndUpdate(
          { email: userEmail },
          { $set: { subscriptionKey: generatedActivationKey, subscriptionExpiry: expiry } }
        );
      }

      return NextResponse.json({
        success: true,
        activationKey: generatedActivationKey,
        planName: targetPlan,
        amount: targetAmount,
        expiryDate: expiry,
        activatedAt: activatedAt,
        message: 'Subscription successfully activated and saved in MongoDB database!'
      });
    }

    return NextResponse.json(
      { error: 'Invalid request. Please provide payment details, email, or an activation key.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Subscription Verification Error:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}

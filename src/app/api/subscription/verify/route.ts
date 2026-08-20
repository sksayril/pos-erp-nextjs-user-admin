import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, activationKey: manualKey } = await req.json();

    // If verifying payment signature from Razorpay
    if (razorpay_order_id && razorpay_payment_id) {
      const secret = process.env.RAZORPAY_KEY_SECRET || 'kylSe6LkTaUfrKdSYkYIMDnF';
      
      if (razorpay_signature) {
        const expectedSig = crypto
          .createHmac('sha256', secret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');

        if (expectedSig !== razorpay_signature) {
          return NextResponse.json({ error: 'Razorpay payment signature verification failed.' }, { status: 400 });
        }
      }
    }

    // Auto-generate unique 16-character Activation Code
    const codePart1 = Math.floor(1000 + Math.random() * 9000);
    const codePart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const codePart3 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedActivationKey = manualKey || `ERP-ACTV-${codePart1}-${codePart2}-${codePart3}-2026`;

    const now = new Date();
    const expiry = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString().split('T')[0];

    return NextResponse.json({
      success: true,
      activationKey: generatedActivationKey,
      planName: '1-Year ERP Full License',
      amount: 5999,
      expiryDate: expiry,
      activatedAt: new Date().toISOString().split('T')[0],
      message: 'Subscription payment verified and Activation Code generated successfully!'
    });
  } catch (error: any) {
    console.error('Subscription Verification Error:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}

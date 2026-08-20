import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST() {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_T3yxQHxDAjRVvh';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'kylSe6LkTaUfrKdSYkYIMDnF';

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: 599900, // ₹5,999 in paise
      currency: 'INR',
      receipt: `rcpt_erp_${Date.now()}`,
      notes: {
        plan: 'POS ERP 1-Year License',
        price: 'Rs. 5,999'
      }
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId
    });
  } catch (error: any) {
    console.error('Razorpay Order Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create Razorpay order' }, { status: 500 });
  }
}

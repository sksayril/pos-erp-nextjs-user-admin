'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RazorpayRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/subscription');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-semibold text-muted-foreground">Redirecting to Razorpay Subscription portal...</p>
      </div>
    </div>
  );
}

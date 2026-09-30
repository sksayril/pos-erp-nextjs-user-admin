'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditProductRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/products/create?edit=${id}`);
    } else {
      router.replace('/products');
    }
  }, [id, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground text-sm">
      <p className="animate-pulse">Loading Product Editor...</p>
    </div>
  );
}
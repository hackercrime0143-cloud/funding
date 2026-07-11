'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      router.replace('/?admin=true');
    }
  }, [router]);

  return (
    <div style={{
      background: '#0a0f1d',
      color: '#ffffff',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Outfit, sans-serif'
    }}>
      <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
        Loading Admin Control Board...
      </div>
    </div>
  );
}

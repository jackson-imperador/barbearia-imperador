'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BarbeariaOperacionalRedirect() {
  const router = useRouter();
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.roles?.includes('OWNER')) {
          router.replace('/owner/profile');
        } else {
          router.replace('/barber/profile');
        }
      } catch (e) {
        router.replace('/');
      }
    } else {
      router.replace('/');
    }
  }, [router]);
  return null;
}

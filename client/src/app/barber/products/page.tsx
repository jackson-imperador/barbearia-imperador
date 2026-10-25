'use client';
import * as React from 'react';
import { StoreManagementView } from '@/components/store/StoreManagementView';

export default function BarberProductsPage() {
  return <StoreManagementView defaultTab="produtos" basePath="/barber/products" />;
}

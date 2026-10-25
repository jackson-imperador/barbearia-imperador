'use client';
import * as React from 'react';
import { StoreManagementView } from '@/components/store/StoreManagementView';

export default function BarberOrdersPage() {
  return <StoreManagementView defaultTab="pedidos" basePath="/barber/products" />;
}

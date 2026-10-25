'use client';
import * as React from 'react';
import { StoreManagementView } from '@/components/store/StoreManagementView';

export default function OwnerOrdersPage() {
  return <StoreManagementView defaultTab="pedidos" basePath="/owner/products" />;
}

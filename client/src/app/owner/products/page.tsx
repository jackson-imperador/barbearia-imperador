'use client';
import * as React from 'react';
import { StoreManagementView } from '@/components/store/StoreManagementView';

export default function AdminProductsPage() {
  return <StoreManagementView defaultTab="produtos" basePath="/owner/products" />;
}

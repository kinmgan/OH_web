'use client';

import CustomerTable from '@/components/customers/CustomerTable';
import HealthRadarChart from '@/components/customers/HealthRadarChart';

export default function CustomersPage() {
  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#333', marginBottom: '24px' }}>
        Quản lý khách hàng
      </h1>
      <div style={{ marginBottom: '32px' }}>
        <HealthRadarChart />
      </div>
      <CustomerTable />
    </div>
  );
}

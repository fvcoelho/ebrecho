import { ProtectedRoute } from '@/components/auth/protected-route';

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'PARTNER_USER']}>
      {children}
    </ProtectedRoute>
  );
}
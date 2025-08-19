import { ProtectedRoute } from '@/components/auth/protected-route';

export default function PromoterLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['PROMOTER', 'PARTNER_PROMOTER']}>
      {children}
    </ProtectedRoute>
  );
}
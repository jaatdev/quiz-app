import ProtectedLayout from '@/components/ProtectedLayout';

export default function MyHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout>
      {children}
    </ProtectedLayout>
  );
}
import ProtectedLayout from '@/components/ProtectedLayout';

export default function QuizLayout({
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
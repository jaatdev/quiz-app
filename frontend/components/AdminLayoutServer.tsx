import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AdminLayoutServer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // You can add additional admin role checks here if needed
  // For now, any authenticated user can access admin routes

  return <>{children}</>;
}
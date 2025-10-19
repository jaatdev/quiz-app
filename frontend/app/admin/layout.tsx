import AdminLayoutServer from '@/components/AdminLayoutServer';
import AdminLayoutClient from './AdminLayoutClient';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutServer>
      <AdminLayoutClient>
        {children}
      </AdminLayoutClient>
    </AdminLayoutServer>
  );
}

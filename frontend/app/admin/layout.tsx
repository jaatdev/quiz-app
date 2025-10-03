'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, BookOpen, FileText, Users, 
  Upload, Settings, ChevronRight, Menu, X 
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/config';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: {
          'x-clerk-user-id': user.id,
        },
      });

      if (response.ok) {
        setIsAdmin(true);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Admin check failed:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Checking permissions...</h1>
          <p className="text-gray-600">Please wait while we verify your access.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/subjects', label: 'Subjects', icon: BookOpen },
    { href: '/admin/questions', label: 'Questions', icon: FileText },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/import', label: 'Bulk Import', icon: Upload },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-white border-r transform transition-transform lg:translate-x-0 z-40',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
          <p className="text-sm text-gray-600">Quiz Management System</p>
        </div>
        
        <nav className="px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors mb-1"
              onClick={() => setIsSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5 text-gray-700" />
              <span className="text-gray-800">{item.label}</span>
              <ChevronRight className="w-4 h-4 ml-auto text-gray-600" />
            </Link>
          ))}
        </nav>
        
        <div className="absolute bottom-6 left-0 right-0 px-6">
          <Link
            href="/"
            className="block px-4 py-2 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 p-6">
        {children}
      </main>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

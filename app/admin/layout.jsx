import AdminSidebar from '@/components/admin/Sidebar';

export default function AdminLayout({ children }) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-bglight">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-7 md:p-9 min-w-0">{children}</main>
    </div>
  );
}

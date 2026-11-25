import AdminSidebar from '@/components/admin/Sidebar';

export default function AdminLayout({ children }) {
  return <div className="flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden bg-bglight"><AdminSidebar/><main className="flex-1 min-w-0 w-full p-3.5 sm:p-7 lg:p-9 xl:p-10 lg:ml-[282px]"><div className="page-shell">{children}</div></main></div>;
}

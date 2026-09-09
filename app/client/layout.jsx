import ClientSidebar from '@/components/client/Sidebar';

export default function ClientLayout({ children }) {
  return <div className="flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden bg-bglight"><ClientSidebar/><main className="flex-1 min-w-0 w-full p-3.5 sm:p-7 lg:p-9 xl:p-10"><div className="page-shell">{children}</div></main></div>;
}

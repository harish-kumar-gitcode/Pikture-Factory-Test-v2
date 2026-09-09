import VendorSidebar from '@/components/vendor/Sidebar';

export default function VendorLayout({ children }) {
  return <div className="flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden bg-bglight"><VendorSidebar/><main className="flex-1 min-w-0 w-full p-3.5 sm:p-7 lg:p-9 xl:p-10 lg:ml-[282px]"><div className="page-shell">{children}</div></main></div>;
}

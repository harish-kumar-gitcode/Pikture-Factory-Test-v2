import VendorSidebar from '@/components/vendor/Sidebar';

export default function VendorLayout({ children }) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-bglight">
      <VendorSidebar />
      <main className="flex-1 p-4 sm:p-7 md:p-9 min-w-0">{children}</main>
    </div>
  );
}

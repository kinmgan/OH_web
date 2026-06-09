import AccountSidebar from './components/AccountSidebar';
import AccountBreadcrumb from './components/AccountBreadcrumb';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tài khoản | Oriental Herbs',
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FCF8F1] pb-24 pt-4 px-4 md:px-12 lg:px-24">
      <div className="max-w-[1280px] mx-auto">
        <AccountBreadcrumb />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Cột trái: Menu Sidebar */}
          <aside className="lg:col-span-1 flex justify-center lg:justify-start">
            <div className="w-full max-w-[200px] lg:ml-12 mt-4">
              <AccountSidebar />
            </div>
          </aside>
          
          {/* Cột phải: Nội dung phân trang */}
          <main className="lg:col-span-3 bg-white p-8 md:p-12 shadow-sm rounded-sm">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

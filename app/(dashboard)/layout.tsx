import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { RequireAuth } from "@/components/auth/require-auth";
import { LocaleProvider } from "@/lib/i18n";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireAuth>
      <LocaleProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col h-screen overflow-hidden">
            <Header />
            <div className="flex-1 overflow-auto p-6 bg-white">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </LocaleProvider>
    </RequireAuth>
  );
}

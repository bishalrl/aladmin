import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ToastProvider } from "@/components/ui/Toast";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Central Admin Platform",
  description: "Manage Budgeting Sathi and YantraMed from one dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex items-center justify-between gap-4 pl-16 lg:pl-0">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Central Admin Platform
                </p>
                <p className="text-xs text-slate-500">
                  Ads · Course media · Users · Account deletion
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/firebase"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Firebase
                </Link>
                <Link
                  href="/admin/api/docs"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  API Docs
                </Link>
              </div>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}

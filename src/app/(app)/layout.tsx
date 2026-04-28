import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-workspace relative flex min-h-screen overflow-hidden bg-[#020403] text-[#F8FAF7]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_24%_0%,rgba(62,242,160,0.12),transparent_28%),radial-gradient(circle_at_92%_18%,rgba(0,107,85,0.16),transparent_34%),linear-gradient(180deg,#020403_0%,#050A0D_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.055] [background-image:linear-gradient(to_right,#F8FAF7_1px,transparent_1px),linear-gradient(to_bottom,#F8FAF7_1px,transparent_1px)] [background-size:84px_84px]" />
      <Sidebar />
      <div className="relative z-10 flex flex-1 flex-col pl-60 transition-all duration-300">
        <TopBar />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

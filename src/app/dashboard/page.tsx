import Navbar from "@/components/Navbar";
import DashboardClient from "@/components/DashboardClient";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <DashboardClient />
      </main>
    </div>
  );
}

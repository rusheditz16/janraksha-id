import Navbar from "@/components/Navbar";
import ScannerComponent from "@/components/ScannerComponent";

export default function ScannerPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 py-6">
        <ScannerComponent />
      </main>
    </div>
  );
}

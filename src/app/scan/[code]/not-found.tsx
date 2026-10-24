import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-4">
        <div className="w-16 h-16 bg-rose-600/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black">JanRaksha ID Not Found</h1>
        <p className="text-sm text-slate-400">
          The scanned QR code or NFC tag does not match any active emergency profile in our system.
        </p>
        <div className="pt-2">
          <Link
            href="/scanner"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Try Scanning Again
          </Link>
        </div>
      </div>
    </div>
  );
}

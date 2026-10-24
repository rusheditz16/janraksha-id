"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, AlertTriangle, Shield, ArrowRight, UserPlus, RefreshCw } from "lucide-react";
import EmergencyClientView from "@/components/EmergencyClientView";

interface ScanClientFallbackProps {
  code: string;
}

export default function ScanClientFallback({ code }: ScanClientFallbackProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    // 1. Check client browser localStorage for recent registrations
    try {
      const raw = localStorage.getItem("janraksha_recent_profiles");
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const query = code.trim().toUpperCase();
          const match = list.find(
            (p: any) =>
              p.janRakshaCode?.toUpperCase() === query ||
              p.id === code ||
              p.wristbandUid?.toUpperCase() === query
          );
          if (match) {
            setProfile(match);
            setLoading(false);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Local storage check error:", e);
    }

    // 2. Fetch from API endpoint
    fetch(`/api/profiles/${encodeURIComponent(code)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setProfile(json.data);
        }
      })
      .catch((err) => console.warn(err))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F8FC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#1769E0] flex items-center justify-center animate-spin mb-4">
          <RefreshCw className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[#0B1F3A]">Resolving Emergency Identity...</h2>
        <p className="text-xs text-[#64748B] mt-1 font-mono">Querying record {code}</p>
      </div>
    );
  }

  if (profile) {
    return <EmergencyClientView profile={profile} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F8FC] text-[#172B4D] py-12 px-4 sm:px-6">
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#DCE5F0] p-6 sm:p-8 shadow-sm space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#D97706] border border-amber-200 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-[#0B1F3A]">Identity Record Not Found</h1>
          <p className="text-xs text-[#64748B] font-mono">
            Could not find an active registration for &ldquo;{code}&rdquo;
          </p>
        </div>

        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-left text-xs text-[#172B4D] space-y-1">
          <p className="font-bold text-[#1769E0]">Tip for Volunteer Scanning:</p>
          <p className="text-[#64748B]">
            Ensure the entire QR code is visible in your camera frame. The QR code contains verified emergency kin contacts encoded directly inside.
          </p>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
            Test Demonstration Profiles
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/scan/JR-KID-4029"
              className="p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-[#1769E0] font-mono font-bold"
            >
              JR-KID-4029
            </Link>
            <Link
              href="/scan/JR-ELD-7193"
              className="p-2.5 rounded-lg bg-slate-50 hover:bg-amber-50 border border-slate-200 text-[#D97706] font-mono font-bold"
            >
              JR-ELD-7193
            </Link>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/scanner"
            className="w-full py-2.5 rounded-lg bg-[#0B1F3A] hover:bg-[#1769E0] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Open Volunteer Scanner</span>
          </Link>
          <Link
            href="/register"
            className="w-full py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-[#DCE5F0] text-[#172B4D] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#1769E0]" />
            <span>Register a Person</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

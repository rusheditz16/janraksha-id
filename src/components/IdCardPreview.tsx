"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import {
  Download,
  Printer,
  Shield,
  HeartPulse,
  User,
  Phone,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  ExternalLink
} from "lucide-react";

interface IdCardPreviewProps {
  profile: {
    janRakshaCode: string;
    fullName: string;
    age?: number | null;
    gender?: string | null;
    personType: string;
    bloodGroup?: string | null;
    guardianName: string;
    guardianPhone: string;
    guardianAltPhone?: string | null;
    allergies?: string | null;
    chronicIllness?: string | null;
    criticalNotes?: string | null;
    eventName?: string | null;
    assignedBooth?: string | null;
    photoUrl?: string | null;
  };
}

export default function IdCardPreview({ profile }: IdCardPreviewProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const scanUrl = `${origin}/scan/${profile.janRakshaCode}`;

    QRCode.toDataURL(scanUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: "#0B1F3A",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [profile.janRakshaCode]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#DCE5F0] flex flex-wrap items-center justify-between gap-3 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#DCE5F0] bg-white p-0.5 flex items-center justify-center">
            <Image src="/logo.png" alt="JanRaksha Logo" width={38} height={38} className="object-cover rounded-lg" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0B1F3A]">Printable Digital Identity Card</h4>
            <p className="text-[11px] text-[#64748B]">Connecting people when they need help the most</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/scan/${profile.janRakshaCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-[#1769E0] border border-blue-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Scan View</span>
          </a>
          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`${profile.janRakshaCode}-qr.png`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#172B4D] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download QR</span>
            </a>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1769E0] hover:bg-[#1255B8] text-xs font-semibold text-white shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Badge / Wristband</span>
          </button>
        </div>
      </div>

      {/* Printable Cards Grid */}
      <div ref={printRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 print:m-0 print:p-0">
        
        {/* Front of Card */}
        <div className="w-full max-w-sm mx-auto bg-white border border-[#DCE5F0] rounded-2xl p-6 shadow-sm flex flex-col justify-between print-card-break">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                  <Image src="/logo.png" alt="Logo" width={22} height={22} className="object-cover" />
                </div>
                <span className="text-xs font-bold text-[#0B1F3A] tracking-tight">JanRaksha ID</span>
              </div>
              <span className="text-[10px] font-bold text-[#1769E0] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                EMERGENCY IDENTITY
              </span>
            </div>

            <div className="my-4 flex items-center gap-4">
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={profile.fullName}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  {profile.personType}
                </span>
                <h3 className="text-base font-bold text-[#0B1F3A] leading-tight">{profile.fullName}</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {profile.age ? `Age: ${profile.age}` : ""} {profile.gender ? `• ${profile.gender}` : ""}
                </p>
                {profile.bloodGroup && profile.bloodGroup !== "UNKNOWN" && (
                  <span className="text-xs font-bold text-[#E5484D] mt-0.5 inline-block">
                    Blood: {profile.bloodGroup.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>

            {(profile.chronicIllness || profile.allergies) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3 text-xs text-[#E5484D]">
                <span className="font-bold">Medical Alert: </span>
                {profile.chronicIllness || profile.allergies}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="font-mono font-bold text-[#0B1F3A]">ID: {profile.janRakshaCode}</span>
            <span>{profile.eventName || "Verified Registration"}</span>
          </div>
        </div>

        {/* Back of Card / QR Side */}
        <div className="w-full max-w-sm mx-auto bg-white border border-[#DCE5F0] rounded-2xl p-6 shadow-sm flex flex-col items-center justify-between text-center print-card-break">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
              Authorized Volunteer Scan
            </span>
            <h4 className="text-sm font-bold text-[#0B1F3A] mt-0.5">
              Instant Family Reunification
            </h4>
          </div>

          <div className="my-3 p-2 bg-white rounded-xl border border-slate-200">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="JanRaksha QR" className="w-40 h-40" />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-mono font-bold text-[#0B1F3A]">
              Record ID: {profile.janRakshaCode}
            </p>
            <p className="text-[11px] text-[#64748B]">
              Scan with camera to connect with emergency guardians and pin GPS location.
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 w-full text-[10px] text-slate-400 flex justify-between">
            <span>NFC & QR Enabled</span>
            <span>Opaque Security Token</span>
          </div>
        </div>

        {/* Wristband Format Strip */}
        <div className="md:col-span-2 bg-[#F5F8FC] border border-[#DCE5F0] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 print-card-break">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-cover" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0B1F3A]">Wristband Strip Layout</div>
              <p className="text-[11px] text-[#64748B]">
                Connecting people when they need help the most.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-[#DCE5F0]">
            {qrDataUrl && <img src={qrDataUrl} alt="Mini QR" className="w-10 h-10" />}
            <div className="text-left font-mono">
              <div className="text-xs font-bold text-[#0B1F3A]">{profile.fullName}</div>
              <div className="text-[10px] text-[#1769E0] font-semibold">{profile.janRakshaCode}</div>
            </div>
          </div>
        </div>

      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2 no-print">
        <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
        <span>
          <strong>Important:</strong> JanRaksha ID cards are emergency reunification tools for events and hospitals. They are not official government identity documents.
        </span>
      </div>

    </div>
  );
}
